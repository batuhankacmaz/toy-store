import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../utils/verify"
import {
    networkConfig,
    developmentChains,
    INITIAL_SUPPLY,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId: number = network.config.chainId!
    const ownerAddress: string = process.env.OWNER_ADDRESS!
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    const ourToken = await deploy("ToyToken", {
        from: deployer,
        args: [deployer, INITIAL_SUPPLY],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: waitBlockConfirmations,
    })
    log(`toyToken deployed at ${ourToken.address}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(ourToken.address, [INITIAL_SUPPLY])
    }
}

export default deployToken
deployToken.tags = ["all", "tokens"]
