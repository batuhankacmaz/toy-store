import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { ToyFactory, VRFCoordinatorV2Mock } from "../../typechain-types"

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Toy Factory Staging Tests", function () {
          let toyFactory: ToyFactory, deployer

          this.beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              toyFactory = await ethers.getContract("ToyFactory")
          })
      })
