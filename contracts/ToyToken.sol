// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToyToken is ERC20, Ownable {
    constructor(address ownerAddress, uint256 initialSupply) ERC20("ToyToken", "TT") {
        _mint(ownerAddress, initialSupply);
        _transferOwnership(ownerAddress);
    }
}
