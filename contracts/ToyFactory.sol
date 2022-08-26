// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// TODOS:
// Create Toy
// ??
// Hulk  rare
// Batman uncommon
// Spiderman  common

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error ToyFactory__RangeOutOfBounds();
error ToyFactory__NeedMoreETHSent();
error ToyFactory__TransferFailed();
error ToyFactory__AlreadyInitialized();
error ToyFactory__TooHighFee();

contract ToyFactory is ERC721URIStorage, VRFConsumerBaseV2, Ownable {
    // Type Declarations
    enum Toy {
        HULK,
        BATMAN,
        SPIDERMAN
    }
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_toyTokenUris;
    uint256 internal s_mintFee;
    bool private s_initialized;

    //Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Toy indexed chosenToy, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 mintFee,
        uint32 callbackGasLimit,
        string[3] memory toyTokenUris
    ) ERC721("Toy NFT", "TN") VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_mintFee = mintFee;
        _initializeContract(toyTokenUris);
    }

    function requestNFT() public payable returns (uint256 requestId) {
        if (msg.value < s_mintFee) {
            revert ToyFactory__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address toyOwner = s_requestIdToSender[requestId];
        s_tokenCounter = s_tokenCounter + 1;
        uint256 newItemId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Toy chosenToy = getToyFromModdedRng(moddedRng);
        _safeMint(toyOwner, newItemId);
        _setTokenURI(newItemId, s_toyTokenUris[uint256(chosenToy)]);
        console.log("s_toyTokenUris[uint256(chosenToy)]", s_toyTokenUris[uint256(chosenToy)]);
        emit NftMinted(chosenToy, toyOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert ToyFactory__TransferFailed();
        }
    }

    function changeNFTFee(uint256 newFee) public onlyOwner {
        if (newFee > 1 * 10**17) {
            revert ToyFactory__TooHighFee();
        }
        s_mintFee = newFee;
    }

    function _initializeContract(string[3] memory toyTokenUris) private {
        if (s_initialized) {
            revert ToyFactory__AlreadyInitialized();
        }
        s_toyTokenUris = toyTokenUris;
        s_initialized = true;
    }

    function getToyFromModdedRng(uint256 moddedRng) public pure returns (Toy) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArracy = getChanceArray();
        for (uint256 i = 0; i < chanceArracy.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArracy[i]) {
                return Toy(i);
            }
            cumulativeSum = cumulativeSum + chanceArracy[i];
        }
        revert ToyFactory__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 40, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return s_mintFee;
    }

    function getToyTokenUris(uint256 index) public view returns (string memory) {
        return s_toyTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }
}
