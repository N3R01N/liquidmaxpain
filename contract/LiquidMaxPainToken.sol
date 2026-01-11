// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./ILiquidMaxPainToken.sol";

contract LiquidMaxPainToken is
    ILiquidMaxPainToken,
    ERC20,
    IERC721Receiver,
    ReentrancyGuard
{
    IERC721 public immutable maxPainCollection;
    uint256 private constant RATIO = 100 ether; // 100 tokens per max pain

    error UnauthorizedCollection();
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotTokenOwner();

    event Liquify(uint256 tokenId, address from);
    event Solidify(uint256 tokenId, address to);

    constructor(
        address _erc721Address,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        if (_erc721Address == address(0)) revert UnauthorizedCollection();
        maxPainCollection = IERC721(_erc721Address);
    }

    function onERC721Received(
        address operator,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override nonReentrant returns (bytes4) {
        if (msg.sender != address(maxPainCollection))
            revert UnauthorizedCollection();
        _mint(operator, RATIO);
        emit Liquify(tokenId, operator);
        return IERC721Receiver.onERC721Received.selector;
    }

    function solidify(uint256 tokenId, address to) public nonReentrant {
        if (address(this) != maxPainCollection.ownerOf(tokenId))
            revert NotTokenOwner();
        uint256 erc20Amount = ERC20(this).balanceOf(msg.sender);
        if (erc20Amount < RATIO) revert InsufficientPayment(RATIO, erc20Amount);
        _burn(msg.sender, RATIO);
        maxPainCollection.safeTransferFrom(address(this), to, tokenId);
        emit Solidify(tokenId, to);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId;
    }
}