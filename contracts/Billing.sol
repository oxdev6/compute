// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Billing
 * @notice Handles payments and subscriptions for compute endpoints
 * @dev Supports both ETH and ERC20 token payments
 */
contract Billing is Ownable {
    // Payment structure
    struct Payment {
        address payer;
        bytes32 node;
        string method;
        uint256 amount;
        uint256 timestamp;
        bool settled;
    }

    // Subscription structure
    struct Subscription {
        address subscriber;
        bytes32 node;
        uint256 amount;
        uint256 period; // seconds
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    // Pricing per endpoint
    mapping(bytes32 => uint256) public prices; // in wei
    mapping(bytes32 => address) public paymentTokens; // address(0) for ETH

    // Payments tracking
    Payment[] public payments;
    mapping(address => uint256[]) public userPayments;

    // Subscriptions
    mapping(address => mapping(bytes32 => Subscription)) public subscriptions;

    // Events
    event PriceSet(bytes32 indexed node, uint256 price, address token);
    event PaymentReceived(
        address indexed payer,
        bytes32 indexed node,
        string method,
        uint256 amount
    );
    event SubscriptionCreated(
        address indexed subscriber,
        bytes32 indexed node,
        uint256 amount,
        uint256 period
    );
    event SubscriptionRenewed(
        address indexed subscriber,
        bytes32 indexed node,
        uint256 newEndTime
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price for an endpoint
     * @param node ENS node
     * @param price Price in wei (or token units)
     * @param token ERC20 token address (address(0) for ETH)
     */
    function setPrice(bytes32 node, uint256 price, address token) external onlyOwner {
        prices[node] = price;
        paymentTokens[node] = token;
        emit PriceSet(node, price, token);
    }

    /**
     * @notice Pay for a single compute call
     * @param node ENS node
     * @param method Method name
     */
    function payForCall(bytes32 node, string calldata method) external payable {
        uint256 price = prices[node];
        require(price > 0, "Billing: endpoint is free");

        address token = paymentTokens[node];
        if (token == address(0)) {
            // ETH payment
            require(msg.value >= price, "Billing: insufficient payment");
            // Refund excess
            if (msg.value > price) {
                payable(msg.sender).transfer(msg.value - price);
            }
        } else {
            // ERC20 payment
            require(msg.value == 0, "Billing: use token payment");
            IERC20(token).transferFrom(msg.sender, address(this), price);
        }

        // Record payment
        uint256 paymentId = payments.length;
        payments.push(Payment({
            payer: msg.sender,
            node: node,
            method: method,
            amount: price,
            timestamp: block.timestamp,
            settled: true
        }));
        userPayments[msg.sender].push(paymentId);

        emit PaymentReceived(msg.sender, node, method, price);
    }

    /**
     * @notice Create or renew subscription
     * @param node ENS node
     * @param period Subscription period in seconds
     */
    function subscribe(bytes32 node, uint256 period) external payable {
        uint256 price = prices[node];
        require(price > 0, "Billing: endpoint is free");

        address token = paymentTokens[node];
        uint256 totalAmount = price * (period / 1 days); // Daily rate

        if (token == address(0)) {
            require(msg.value >= totalAmount, "Billing: insufficient payment");
            if (msg.value > totalAmount) {
                payable(msg.sender).transfer(msg.value - totalAmount);
            }
        } else {
            require(msg.value == 0, "Billing: use token payment");
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }

        Subscription storage sub = subscriptions[msg.sender][node];
        if (sub.active && sub.endTime > block.timestamp) {
            // Renew existing subscription
            sub.endTime += period;
            emit SubscriptionRenewed(msg.sender, node, sub.endTime);
        } else {
            // Create new subscription
            sub.subscriber = msg.sender;
            sub.node = node;
            sub.amount = price;
            sub.period = period;
            sub.startTime = block.timestamp;
            sub.endTime = block.timestamp + period;
            sub.active = true;
            emit SubscriptionCreated(msg.sender, node, price, period);
        }
    }

    /**
     * @notice Check if caller has access (free, paid, or subscribed)
     * @param node ENS node
     * @param caller Caller address
     * @return hasAccess Whether caller has access
     */
    function hasAccess(bytes32 node, address caller) external view returns (bool hasAccess) {
        uint256 price = prices[node];
        if (price == 0) {
            return true; // Free endpoint
        }

        // Check subscription
        Subscription memory sub = subscriptions[caller][node];
        if (sub.active && sub.endTime > block.timestamp) {
            return true;
        }

        return false; // Requires payment
    }

    /**
     * @notice Withdraw collected payments
     * @param token Token address (address(0) for ETH)
     */
    function withdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
        }
    }

    /**
     * @notice Get user's payment history
     * @param user User address
     * @return paymentIds Array of payment IDs
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }

    /**
     * @notice Get payment details
     * @param paymentId Payment ID
     * @return payment Payment details
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
}

