import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { ToyManagment, ToyToken, VRFCoordinatorV2Mock } from "../../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Toy Managment Unit Tests", function () {
          let toyManagmentContract: ToyManagment,
              toyManagment: ToyManagment,
              deployer: SignerWithAddress,
              customer: SignerWithAddress,
              toyToken: ToyToken,
              vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
          this.beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              customer = accounts[1]
              await deployments.fixture(["mocks", "tokens", "toymanagment"])
              toyManagmentContract = await ethers.getContract("ToyManagment")
              toyManagment = toyManagmentContract.connect(customer)
              toyToken = await ethers.getContract("ToyToken")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })
          describe("constructor", function () {
              it("sets starting values correctly", async function () {
                  const toyTokenAddress = await toyManagmentContract.getToyTokenAddress()
                  const getNftFee = await toyManagmentContract.getNFTFee()
                  assert.equal(toyTokenAddress, toyToken.address)
                  assert.equal(getNftFee.toString(), "1000000000000000000000")
              })
              it("sets inital token amount correctly", async function () {
                  const deployerBalanceOf = await toyToken.balanceOf(deployer.address)
                  const totalSupply = await toyToken.totalSupply()
                  assert.equal(deployerBalanceOf.toString(), totalSupply.toString())
              })
          })
          describe("mintNFT", function () {
              it("fails if payment isn't sent with the bigger or equal to request amount", async function () {
                  await expect(toyManagmentContract.mintNFT("1000")).to.be.revertedWith(
                      "ToyManagment__NeedMoreTokensSent"
                  )
              })
              it("take sent amount from requester", async function () {
                  let feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  const contractTokens = await toyToken.balanceOf(toyManagmentContract.address)
                  const senderAmount = await toyManagmentContract.getTotalSenderAmount(
                      deployer.address
                  )
                  assert.equal(contractTokens.toString(), feeAmount.toString())
                  assert.equal(senderAmount.toString(), feeAmount.toString())
              })
              it("nft receiver balance should be decreasing", async function () {
                  const ownerBalanceOf = await toyToken.balanceOf(deployer.address)
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  const afterOwnerBalanceOf = await toyToken.balanceOf(deployer.address)
                  assert.equal(
                      afterOwnerBalanceOf.toString(),
                      (Number(ownerBalanceOf) - Number(feeAmount)).toString()
                  )
              })
              it("contract token balance should be increasing", async function () {
                  const beforeAccumulatedAmount = await toyManagmentContract.getAccumulatedAmount()
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  const afterAccumulatedAmount = await toyManagmentContract.getAccumulatedAmount()

                  assert.equal(beforeAccumulatedAmount.toString(), "0")
                  assert.equal(afterAccumulatedAmount.toString(), feeAmount.toString())
              })
              it("emits and event and kicks off a random word request", async function () {
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  await expect(toyManagmentContract.mintNFT(feeAmount.toString())).to.emit(
                      toyManagmentContract,
                      "NftRequested"
                  )
              })
          })
          describe("withdraw", function () {
              it("fails if the person who made withdraw not the owner", async function () {
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  await expect(toyManagment.withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
              it("withdraw if the person owner", async function () {
                  const ownerBalanceOf = await toyToken.balanceOf(deployer.address)
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  const afterOwnerBalanceOf = await toyToken.balanceOf(deployer.address)
                  assert.equal(
                      afterOwnerBalanceOf.toString(),
                      (Number(ownerBalanceOf) - Number(feeAmount)).toString()
                  )
                  await expect(toyManagmentContract.withdraw()).to.emit(
                      toyManagmentContract,
                      "TokensWithdrawed"
                  )
              })
              it("withdraw if the person owner and balance should be increase", async function () {
                  const feeAmount = await toyManagmentContract.getNFTFee()
                  const approveTxResponse = await toyToken.approve(
                      toyManagmentContract.address,
                      feeAmount
                  )
                  await approveTxResponse.wait(1)
                  const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
                  await txResponse.wait(1)
                  const withdrawTxResponse = await toyManagmentContract.withdraw()
                  await withdrawTxResponse.wait(1)
                  const afterOwnerBalanceOf = await toyToken.balanceOf(deployer.address)
                  const totalSupplyToken = await toyToken.totalSupply()
                  assert.equal(afterOwnerBalanceOf.toString(), totalSupplyToken.toString())
              })
          })
          it("after the withdraw contract token balance should be 0", async function () {
              const feeAmount = await toyManagmentContract.getNFTFee()
              const approveTxResponse = await toyToken.approve(
                  toyManagmentContract.address,
                  feeAmount
              )
              await approveTxResponse.wait(1)
              const txResponse = await toyManagmentContract.mintNFT(feeAmount.toString())
              await txResponse.wait(1)
              const withdrawTxResponse = await toyManagmentContract.withdraw()
              await withdrawTxResponse.wait(1)
              const afterAccumulatedAmount = await toyManagmentContract.getAccumulatedAmount()
              assert.equal(afterAccumulatedAmount.toString(), "0")
          })
          describe("setNFTFee", function () {
              it("change nft fee correctly", async function () {
                  const newFee = "1000000000000000"
                  const changeFeeTxResponse = await toyManagmentContract.setNFTFee(newFee)
                  await changeFeeTxResponse.wait(1)
                  const newContractFee = await toyManagmentContract.getNFTFee()
                  assert.equal(newFee, newContractFee.toString())
              })
          })
      })
