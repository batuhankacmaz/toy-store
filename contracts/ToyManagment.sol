// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ToyFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//Errors

error ToyManagment__NeedMoreTokensSent();
error ToyManagment__WrongToyTokenAddress();

contract ToyManagment is ToyFactory, Ownable {
    using SafeERC20 for IERC20;

    //Managment Variables
    address private immutable i_toyTokenAddress;
    uint256 private s_mintFee;
    mapping(address => uint256) private s_totalSentAmount;

    //Events
    event TokensReceived(address indexed sender, uint256 indexed amount);
    event TokensWithdrawed(address indexed receiver, uint256 indexed amount);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 mintFee,
        uint32 callbackGasLimit,
        string[3] memory toyTokenUris,
        address toyTokenAddress
    ) ToyFactory(vrfCoordinatorV2, subscriptionId, gasLane, callbackGasLimit, toyTokenUris) {
        i_toyTokenAddress = toyTokenAddress;
        s_mintFee = mintFee;
    }

    function mintNFT(uint256 tokenAmount) external {
        if (tokenAmount < s_mintFee) {
            revert ToyManagment__NeedMoreTokensSent();
        }
        if (i_toyTokenAddress == address(0)) {
            revert ToyManagment__WrongToyTokenAddress();
        }
        address requester = msg.sender;
        _requestPermission(requester, tokenAmount);
        requestNFT();
        s_totalSentAmount[msg.sender] += tokenAmount;
    }

    function _requestPermission(address sender, uint256 amount) private {
        IERC20 toyTokenContract = IERC20(i_toyTokenAddress);
        toyTokenContract.safeTransferFrom(sender, address(this), amount);
        emit TokensReceived(sender, amount);
    }

    function withdraw() external onlyOwner {
        if (i_toyTokenAddress == address(0)) {
            revert ToyManagment__WrongToyTokenAddress();
        }
        IERC20 toyTokenContract = IERC20(i_toyTokenAddress);
        uint256 amount = toyTokenContract.balanceOf(address(this));
        address sender = address(this);
        address owner = getOwner();
        toyTokenContract.safeTransferFrom(sender, owner, amount);
        emit TokensWithdrawed(owner, amount);
    }

    function setNFTFee(uint256 newFee) external onlyOwner {
        _setNFTFee(newFee);
    }

    function _setNFTFee(uint256 newFee) private {
        s_mintFee = newFee;
    }

    function getOwner() public view returns (address) {
        return owner();
    }

    function getNFTFee() external view returns (uint256) {
        return s_mintFee;
    }

    function getToyTokenAddress() external view returns (address) {
        return i_toyTokenAddress;
    }

    function getTotalSenderAmount(address sender) external view returns (uint256) {
        return s_totalSentAmount[sender];
    }
}
