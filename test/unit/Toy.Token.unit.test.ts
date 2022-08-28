import { assert, expect } from "chai"
import { deployments, ethers } from "hardhat"
import { INITIAL_SUPPLY } from "../../helper-hardhat-config"
import { ToyToken } from "../../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

describe("toyToken Unit Test", function () {
    let toyToken: ToyToken, deployer: SignerWithAddress, user1: SignerWithAddress
    beforeEach(async function () {
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        user1 = accounts[1]

        await deployments.fixture("tokens")
        toyToken = await ethers.getContract("ToyToken", deployer)
    })
    describe("createToyToken", function () {
        it("Should create tokens", async function () {
            const toyToken1 = toyToken.connect(user1)
            const beforeCreateTokensBalance = await toyToken1.balanceOf(user1.address)
            const createTxResponse = await toyToken1.createToyToken()
            await createTxResponse.wait(1)
            const afterCreateTokensBalance = await toyToken1.balanceOf(user1.address)
            const createTokenAmount = await toyToken1.getTokenAmount()
            const getTokenCreater = await toyToken1.getTokenCreaters(user1.address)
            assert.equal(beforeCreateTokensBalance.toString(), "0")
            assert.equal(afterCreateTokensBalance.toString(), createTokenAmount.toString())
            assert.equal(afterCreateTokensBalance.toString(), getTokenCreater.toString())
        })
    })

    it("Should have correct ownerAddress of token", async function () {
        const tokenOwner = await toyToken.owner()
        assert.equal(tokenOwner, deployer.address)
    })

    it("Should have correct INITIAL_SUPPLY of token ", async function () {
        const totalSupply = await toyToken.totalSupply()
        console.log("totalSupply", totalSupply.toString())
        assert.equal(totalSupply.toString(), INITIAL_SUPPLY)
    })

    it("Should be able to transfer tokens successfully to an address", async function () {
        const tokensToSend = ethers.utils.parseEther("10")
        await toyToken.transfer(user1.address, tokensToSend)
        expect(await toyToken.balanceOf(user1.address)).to.equal(tokensToSend)
    })

    it("Should approve other address to spend token", async () => {
        const tokensToSpend = ethers.utils.parseEther("5")
        await toyToken.approve(user1.address, tokensToSpend)
        const toyToken1 = await ethers.getContract("ToyToken", user1)
        await toyToken1.transferFrom(deployer.address, user1.address, tokensToSpend)
        expect(await toyToken1.balanceOf(user1.address)).to.equal(tokensToSpend)
    })
})
