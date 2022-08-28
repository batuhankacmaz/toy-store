// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToyToken is ERC20, Ownable {
    // Toy Token Variables
    uint256 private constant TOKEN_AMOUNT = 1000 * 10**18;
    mapping(address => uint256) private s_tokenCreaters;

    // Events
    event CreateToyToken(address indexed requesterAddress, uint256 indexed amount);

    constructor(address ownerAddress, uint256 initialSupply) ERC20("ToyToken", "TT") {
        _mint(ownerAddress, initialSupply);
        _transferOwnership(ownerAddress);
    }

    function createToyToken() external {
        address requesterAddress = msg.sender;
        _mint(requesterAddress, TOKEN_AMOUNT);
        s_tokenCreaters[requesterAddress] += TOKEN_AMOUNT;
        emit CreateToyToken(requesterAddress, TOKEN_AMOUNT);
    }

    function getTokenCreaters(address creator) external view returns (uint256) {
        return s_tokenCreaters[creator];
    }

    function getTokenAmount() external pure returns (uint256) {
        return TOKEN_AMOUNT;
    }
}
