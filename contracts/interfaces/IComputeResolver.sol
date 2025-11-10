// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComputeResolver
 * @notice Interface for ENS Compute Resolver that supports verifiable off-chain computation
 */
interface IComputeResolver {
    /**
     * @notice Resolves an ENS name to a computed result via CCIP-Read
     * @param node The ENS node (namehash)
     * @param data Additional data for the computation
     * @return result The computed result (triggers CCIP-Read off-chain lookup)
     */
    function resolve(bytes32 node, bytes calldata data) external view returns (bytes memory result);

    /**
     * @notice Callback function for CCIP-Read that verifies and returns the computed result
     * @param response The off-chain computation result
     * @param extraData Additional data passed from the resolver
     * @return The verified computation result
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory);

    /**
     * @notice Sets the off-chain gateway URL for a given node
     * @param node The ENS node
     * @param gatewayURL The URL of the off-chain compute gateway
     */
    function setGatewayURL(bytes32 node, string calldata gatewayURL) external;

    /**
     * @notice Gets the gateway URL for a node
     * @param node The ENS node
     * @return The gateway URL
     */
    function getGatewayURL(bytes32 node) external view returns (string memory);
}

