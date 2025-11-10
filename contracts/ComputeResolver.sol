// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IComputeResolver.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IEnvelope.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComputeResolver
 * @notice ENS resolver that maps names to verifiable computation endpoints via CCIP-Read
 * @dev Implements EIP-3668 (CCIP-Read) for off-chain resolution
 */
contract ComputeResolver is IComputeResolver, Ownable {
    // Error for CCIP-Read off-chain lookup
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    // Mapping from node to gateway URL
    mapping(bytes32 => string) public gatewayURLs;
    
    // Mapping from node to authorized signer
    mapping(bytes32 => address) public authorizedSigners;
    
    // Default verifier contract
    IVerifier public verifier;
    
    // Optional envelope verifier for canonical envelopes
    IEnvelope public envelopeVerifier;
    
    // Optional L2 cache contract
    address public l2Cache;

    event GatewayURLSet(bytes32 indexed node, string gatewayURL);
    event SignerSet(bytes32 indexed node, address signer);
    event EnvelopeResolved(bytes32 indexed node, bytes32 digest);

    constructor(address _verifier, address _envelopeVerifier) Ownable(msg.sender) {
        verifier = IVerifier(_verifier);
        if (_envelopeVerifier != address(0)) {
            envelopeVerifier = IEnvelope(_envelopeVerifier);
        }
    }

    /**
     * @notice Resolves an ENS name to a computed result
     * @dev Triggers CCIP-Read off-chain lookup via OffchainLookup error
     * @param node The ENS node (namehash)
     * @param data Additional data for the computation (e.g., function selector, parameters)
     * @return This function reverts with OffchainLookup to trigger off-chain resolution
     */
    function resolve(bytes32 node, bytes calldata data)
        external
        view
        override
        returns (bytes memory)
    {
        string memory url = gatewayURLs[node];
        require(bytes(url).length > 0, "ComputeResolver: no gateway URL set for node");

        // Trigger CCIP-Read off-chain lookup
        string[] memory urls = new string[](1);
        urls[0] = url;

        revert OffchainLookup(
            address(this),
            urls,
            abi.encode(node, data),
            this.resolveWithProof.selector,
            abi.encode(node)
        );
    }

    /**
     * @notice Callback function for CCIP-Read that verifies and returns the computed result
     * @param response The off-chain computation result (ABI-encoded: result, signature) or envelope
     * @param extraData Additional data passed from resolve() (contains node)
     * @return The verified computation result
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        override
        returns (bytes memory)
    {
        // Decode extraData to get node
        bytes32 node = abi.decode(extraData, (bytes32));
        
        // Try to decode as envelope first, fallback to legacy format
        try this.resolveWithEnvelope(response, extraData) returns (bytes memory result) {
            return result;
        } catch {
            // Legacy format: (bytes result, bytes signature)
            (bytes memory result, bytes memory signature) = abi.decode(response, (bytes, bytes));
            
            // Get authorized signer for this node
            address signer = authorizedSigners[node];
            require(signer != address(0), "ComputeResolver: no authorized signer set");
            
            // Verify signature
            require(
                verifier.verify(result, signature, signer),
                "ComputeResolver: invalid signature"
            );
            
            return result;
        }
    }

    /**
     * @notice Resolve with canonical envelope format
     * @param response ABI-encoded envelope
     * @param extraData Contains node
     * @return The result from the envelope
     */
    function resolveWithEnvelope(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory)
    {
        bytes32 node = abi.decode(extraData, (bytes32));
        
        // Decode envelope
        IEnvelope.Envelope memory envelope = abi.decode(response, (IEnvelope.Envelope));
        
        // Get authorized signer
        address signer = authorizedSigners[node];
        require(signer != address(0), "ComputeResolver: no authorized signer set");
        
        // Verify envelope if verifier is set
        if (address(envelopeVerifier) != address(0)) {
            require(
                envelopeVerifier.verifyEnvelope(envelope, signer),
                "ComputeResolver: invalid envelope"
            );
        } else {
            // Fallback to basic signature verification
            require(
                verifier.verify(bytes(envelope.result), envelope.signature, signer),
                "ComputeResolver: invalid signature"
            );
        }
        
        emit EnvelopeResolved(node, envelope.digest);
        
        // Return result as bytes
        return bytes(envelope.result);
    }

    /**
     * @notice Sets the off-chain gateway URL for a given node
     * @param node The ENS node
     * @param gatewayURL The URL of the off-chain compute gateway
     */
    function setGatewayURL(bytes32 node, string calldata gatewayURL) external override onlyOwner {
        gatewayURLs[node] = gatewayURL;
        emit GatewayURLSet(node, gatewayURL);
    }

    /**
     * @notice Gets the gateway URL for a node
     * @param node The ENS node
     * @return The gateway URL
     */
    function getGatewayURL(bytes32 node) external view override returns (string memory) {
        return gatewayURLs[node];
    }

    /**
     * @notice Sets the authorized signer for a node
     * @param node The ENS node
     * @param signer The address authorized to sign computation results
     */
    function setSigner(bytes32 node, address signer) external onlyOwner {
        authorizedSigners[node] = signer;
        emit SignerSet(node, signer);
    }

    /**
     * @notice Updates the verifier contract
     * @param _verifier The new verifier contract address
     */
    function setVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
    }

    /**
     * @notice Sets the envelope verifier contract
     * @param _envelopeVerifier The envelope verifier address
     */
    function setEnvelopeVerifier(address _envelopeVerifier) external onlyOwner {
        envelopeVerifier = IEnvelope(_envelopeVerifier);
    }

    /**
     * @notice Sets the L2 cache contract
     * @param _l2Cache The L2 cache contract address
     */
    function setL2Cache(address _l2Cache) external onlyOwner {
        l2Cache = _l2Cache;
    }
}

