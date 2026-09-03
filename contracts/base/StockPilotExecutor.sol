// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StockPilotExecutor is ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 public constant MAX_TRADES = 8;
    address public immutable owner;
    address public immutable authorizedExecutor;
    mapping(address => bool) public approvedTokens;
    mapping(address => bool) public approvedVenues;
    mapping(bytes32 => bool) public usedInstructions;
    bool public paused;

    struct Trade { address tokenIn; address tokenOut; address venue; uint256 amountIn; uint256 amountOutMinimum; bytes data; }
    event InstructionExecuted(bytes32 indexed instructionId, address indexed account, uint256 tradeCount);
    event Paused(bool value);
    error Unauthorized(); error PausedError(); error InvalidInstruction(); error UnsupportedTarget(); error Slippage();

    constructor(address executor) { if (executor == address(0)) revert InvalidInstruction(); owner = msg.sender; authorizedExecutor = executor; }
    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    function setToken(address token, bool allowed) external onlyOwner { approvedTokens[token] = allowed; }
    function setVenue(address venue, bool allowed) external onlyOwner { approvedVenues[venue] = allowed; }
    function setPaused(bool value) external onlyOwner { paused = value; emit Paused(value); }

    function execute(bytes32 instructionId, address account, uint256 deadline, Trade[] calldata trades) external nonReentrant {
        if (msg.sender != authorizedExecutor) revert Unauthorized();
        if (paused || usedInstructions[instructionId] || account == address(0) || block.timestamp > deadline || trades.length == 0 || trades.length > MAX_TRADES) revert InvalidInstruction();
        usedInstructions[instructionId] = true;
        for (uint256 i; i < trades.length; i++) {
            Trade calldata trade = trades[i];
            if (!approvedTokens[trade.tokenIn] || !approvedTokens[trade.tokenOut] || !approvedVenues[trade.venue]) revert UnsupportedTarget();
            uint256 beforeBalance = IERC20(trade.tokenOut).balanceOf(account);
            IERC20(trade.tokenIn).safeTransferFrom(account, trade.venue, trade.amountIn);
            (bool success,) = trade.venue.call(trade.data);
            if (!success) revert InvalidInstruction();
            if (IERC20(trade.tokenOut).balanceOf(account) - beforeBalance < trade.amountOutMinimum) revert Slippage();
        }
        emit InstructionExecuted(instructionId, account, trades.length);
    }
}
