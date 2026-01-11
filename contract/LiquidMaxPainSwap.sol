// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { UniversalRouter } from "@uniswap/universal-router/contracts/UniversalRouter.sol";
import { Commands } from "@uniswap/universal-router/contracts/libraries/Commands.sol";
import { IPoolManager } from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import { IV4Router } from "@uniswap/v4-periphery/src/interfaces/IV4Router.sol";
import { Actions } from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import { IPermit2 } from "@uniswap/permit2/src/interfaces/IPermit2.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { StateLibrary } from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolKey, Currency, IHooks} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {ILiquidMaxPainToken} from "./ILiquidMaxPainToken.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LiquidMaxPainSwap is ReentrancyGuard {
    UniversalRouter public immutable router;
    IPermit2 public immutable permit2;
    ILiquidMaxPainToken public immutable liquidMaxPainToken;
    IERC721 public immutable maxPainCollection; 
    PoolKey public poolKey;

    uint128 public constant TOKEN_AMOUNT = 100 ether;

    error NotTokenOwner(address owner, address sender);
    error NotEnoughEther();
    error NotTokenApproved();
    error NotEnoughTokens();

    event Buy(uint256 tokenId, address to, uint256 amount);
    event Sell(uint256 tokenId, address from, uint256 amount);

    receive() external payable {}

    constructor(address _router, address _permit2, address _liquidMaxPainToken, address _maxPainCollection) {
        router = UniversalRouter(payable(_router));
        permit2 = IPermit2(_permit2);
        liquidMaxPainToken = ILiquidMaxPainToken(_liquidMaxPainToken);
        maxPainCollection = IERC721(_maxPainCollection);
        poolKey = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(_liquidMaxPainToken),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
    }

    function approveTokenWithPermit2(
        uint160 amount,
        uint48 expiration
    ) external {
        liquidMaxPainToken.approve(address(permit2), type(uint256).max);
        permit2.approve(address(liquidMaxPainToken), address(router), amount, expiration);
    }

    function swapMaxPainForEth(
        uint128 minEthOut,
        address recipient,
        uint256 tokenId
    ) external nonReentrant returns (uint256 ethOut) {
        if(maxPainCollection.ownerOf(tokenId) != msg.sender) revert NotTokenOwner(maxPainCollection.ownerOf(tokenId), msg.sender);
        if(maxPainCollection.getApproved(tokenId) != address(this) && !maxPainCollection.isApprovedForAll(msg.sender, address(this))) revert NotTokenApproved();

        maxPainCollection.safeTransferFrom(msg.sender, address(liquidMaxPainToken), tokenId);

        if(liquidMaxPainToken.balanceOf(address(this)) < TOKEN_AMOUNT) revert NotEnoughTokens();
        
        bytes memory commands = abi.encodePacked(uint8(Commands.V4_SWAP));

        bytes memory actions = abi.encodePacked(
            uint8(Actions.SWAP_EXACT_IN_SINGLE),
            uint8(Actions.SETTLE_ALL),
            uint8(Actions.TAKE_ALL)
        );

        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(
            IV4Router.ExactInputSingleParams({
                poolKey: poolKey,
                zeroForOne: false, // token → ETH
                amountIn: TOKEN_AMOUNT,
                amountOutMinimum: minEthOut,
                hookData: bytes("")
            })
        );

        params[1] = abi.encode(Currency.wrap(address(liquidMaxPainToken)), TOKEN_AMOUNT);
        params[2] = abi.encode(Currency.wrap(address(0)), minEthOut);

        bytes[] memory inputs = new bytes[](1);
        inputs[0] = abi.encode(actions, params);

        router.execute(commands, inputs, block.timestamp + 30);

        ethOut = address(this).balance;
        if(ethOut < minEthOut) revert NotEnoughEther();

        payable(recipient).transfer(ethOut);
        emit Sell(tokenId, msg.sender, ethOut);
    }

    function swapEthForMaxPain(
        address recipient,
        uint256 tokenId
    ) external payable nonReentrant returns (uint256 ethUsed) {
        if (msg.value == 0) revert NotEnoughEther();if (msg.value == 0) revert NotEnoughEther();

        uint128 maxEthIn = uint128(msg.value);

        bytes memory commands = abi.encodePacked(uint8(Commands.V4_SWAP));

        bytes memory actions = abi.encodePacked(
            uint8(Actions.SWAP_EXACT_OUT_SINGLE),
            uint8(Actions.SETTLE_ALL),
            uint8(Actions.TAKE_ALL)
        );

        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(
            IV4Router.ExactOutputSingleParams({
                poolKey: poolKey,
                zeroForOne: true, // ETH → token
                amountOut: TOKEN_AMOUNT,
                amountInMaximum: maxEthIn,
                hookData: bytes("")
            })
        );

        params[1] = abi.encode(Currency.wrap(address(0)), maxEthIn);
        params[2] = abi.encode(Currency.wrap(address(liquidMaxPainToken)), TOKEN_AMOUNT);

        bytes[] memory inputs = new bytes[](1);
        inputs[0] = abi.encode(actions, params);

        router.execute{value: msg.value}(
            commands,
            inputs,
            block.timestamp + 30
        );

        ethUsed = maxEthIn - address(this).balance;
        if (address(this).balance > 0) {
            payable(msg.sender).transfer(address(this).balance);
        }
        
        liquidMaxPainToken.solidify(tokenId, recipient);
        if(maxPainCollection.ownerOf(tokenId) != recipient) revert NotTokenOwner(maxPainCollection.ownerOf(tokenId), recipient);
        emit Buy(tokenId, recipient, ethUsed);
    }
}