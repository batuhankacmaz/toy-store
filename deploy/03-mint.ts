import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, network, ethers } = hre
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const toyFactory = await ethers.getContract("ToyFactory", deployer)
    const mintFee = await toyFactory.getMintFee()
    const randomToyNftMintTx = await toyFactory.requestNFT({ value: mintFee.toString() })
    const randomToyNftMintTxReceipt = await randomToyNftMintTx.wait(1)
    await new Promise<void>(async (resolve) => {
        setTimeout(resolve, 300000) // 5 minute timeout time
        // setup listener for our event
        toyFactory.once("NftMinted", async () => {
            resolve()
        })
        if (chainId == 31337) {
            const requestId = randomToyNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, toyFactory.address)
        }
    })
    console.log(`Random Toy NFT index 0 tokenURI: ${await toyFactory.tokenURI(1)}`)
}
export default mint
mint.tags = ["all", "mint"]
