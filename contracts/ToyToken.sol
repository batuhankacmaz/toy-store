// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ToyToken is ERC20 {
    address private immutable i_ownerAddress;

    constructor(address ownerAddress, uint256 initialSupply) ERC20("ToyToken", "TT") {
        i_ownerAddress = ownerAddress;
        _mint(ownerAddress, initialSupply);
    }

    function getOwner() public view returns (address) {
        return i_ownerAddress;
    }
}
