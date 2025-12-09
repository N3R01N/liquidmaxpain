// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // only included Ownable to set a primary ENS name

contract LiquidMaxPainToken is ERC20, IERC721Receiver, ReentrancyGuard, Ownable {
    IERC721 public immutable maxPainCollection; 
    uint256 private constant RATIO = 100 * 1e18; // 100 tokens per max pain

    error UnauthorizedCollection();
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotTokenOwner();

    event Liquify(uint256 tokenId, address from);
    event Solidify(uint256 tokenId, address to);

    constructor(
        address initialOwner,
        address _erc721Address,
        string memory _name,
        string memory _symbol
        ) ERC20(_name, _symbol) Ownable(initialOwner) {
            if(_erc721Address == address(0)) revert UnauthorizedCollection();
            maxPainCollection = IERC721(_erc721Address);
        }

    function onERC721Received(
        address, 
        address from, 
        uint256 tokenId, 
        bytes calldata) external override nonReentrant returns (bytes4){
            if(msg.sender != address(maxPainCollection)) revert UnauthorizedCollection();
           _mint(from, RATIO);
           emit Liquify(tokenId, from);
            return IERC721Receiver.onERC721Received.selector;
        }

    function solidify(uint256 tokenId, uint256 erc20Amount, address to) public nonReentrant {
        if(address(this) != maxPainCollection.ownerOf(tokenId)) revert NotTokenOwner();
        if(erc20Amount < RATIO) revert InsufficientPayment(RATIO, erc20Amount);
        uint256 remainder = erc20Amount - RATIO;
        _burn(msg.sender, erc20Amount);
        maxPainCollection.safeTransferFrom(address(this), to, tokenId);
        if(remainder > 0) {
            _mint(to, remainder);
        }
        emit Solidify(tokenId, to);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual    
        returns (bool)
    {
        return interfaceId == type(IERC721Receiver).interfaceId;
    }
}
