import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { ToyFactory, VRFCoordinatorV2Mock } from "../../typechain-types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Toy Factory Unit Tests", function () {
          let toyFactory: ToyFactory, deployer, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock

          this.beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomtoys"])
              toyFactory = await ethers.getContract("ToyFactory")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("constructor", function () {
              it("sets starting values correctly", async function () {
                  const toyTokenUriZero = await toyFactory.getToyTokenUris(0)
                  const isInitialized = await toyFactory.getInitialized()
                  assert(toyTokenUriZero.includes("https://ipfs.io/"))
                  assert.equal(isInitialized, true)
              })
          })

          describe("requestNft", function () {
              it("fails if payment isn't sent with the request", async function () {
                  await expect(toyFactory.requestNFT()).to.be.revertedWith("NeedMoreETHSent")
              })
              it("emits and event and kicks off a random word request", async function () {
                  const fee = await toyFactory.getMintFee()
                  await expect(toyFactory.requestNFT({ value: fee.toString() })).to.emit(
                      toyFactory,
                      "NftRequested"
                  )
              })
          })
          describe("fulfillRandomWords", function () {
              it("mints NFT after random number returned", async function () {
                  await new Promise<void>(async (resolve, reject) => {
                      toyFactory.once("NftMinted", async () => {
                          try {
                              const tokenUri = await toyFactory.getToyTokenUris(0)
                              const tokenCounter = await toyFactory.getTokenCounter()
                              console.log("tokenUri", tokenUri)
                              assert.equal(tokenUri.toString().includes("https://ipfs.io/"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await toyFactory.getMintFee()
                          const requestNftResponse = await toyFactory.requestNFT({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events![1].args!.requestId,
                              toyFactory.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
      })
