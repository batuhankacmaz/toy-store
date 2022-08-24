import {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
} from "../helper-hardhat-config"
import verify from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { storeImages, storeTokenUriMetada } from "../utils/uploadToPinata"

const FUND_AMOUNT = "1000000000000000000000"
const imagesLocation = "./images/"
let tokenUris = []

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Power",
            value: 100,
        },
    ],
}

const deployRandomToy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chaindId = network.config.chainId!
    let vrfCoordinatorV2Address, subscriptionId

    /* if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    } */
}
