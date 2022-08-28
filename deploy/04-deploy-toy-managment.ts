import {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
} from "../helper-hardhat-config"
import verify from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const FUND_AMOUNT = "1000000000000000000000"
const MINT_FEE = "1000000000000000000000"
let tokenUris = [
    "ipfs://QmUeqnVQLsKDnQyCPaT2dLYTozzonUmB6ULEaARMRFob3n",
    "ipfs://QmPMtg2JFmRAkRDcg1nPcJ7uWmmcQCvjbCjhdJJmqnT9Qh",
    "ipfs://QmUqLCyK33ZRBsDb2zhbgZN8uBLCpXavv8VW7TfTZf8LF5",
]

const deployToyManagment: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId!
    let toyTokenAddress, vrfCoordinatorV2Address, subscriptionId

    if (chainId == 31337) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
        const toyToken = await ethers.getContract("ToyToken")
        toyTokenAddress = toyToken.address
    } else {
        toyTokenAddress = networkConfig[chainId].toyTokenAddress!
    }

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        MINT_FEE,
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
        toyTokenAddress,
    ]

    const toyManagment = await deploy("ToyManagment", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    })
    log("toyMAnagmentabi", toyManagment.abi)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying ...")
        await verify(toyManagment.address, args)
    }
}

export default deployToyManagment
deployToyManagment.tags = ["all", "toymanagment"]
