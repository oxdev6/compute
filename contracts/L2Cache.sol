// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IEnvelope.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title L2Cache
 * @notice Caches signed compute envelopes on L2 for cheaper access
 * @dev Stores envelope digests with TTL and allows verification of cached results
 */
contract L2Cache is Ownable {
    using IEnvelope for IEnvelope.Envelope;

    struct CachedEnvelope {
        bytes32 digest;
        uint256 timestamp;
        uint256 ttl;
        string envelopeURI; // IPFS hash or HTTP URL
        bool exists;
    }

    // Mapping: node => method => paramsHash => cached envelope
    mapping(bytes32 => mapping(string => mapping(bytes32 => CachedEnvelope))) public cache;
    
    // Envelope verifier
    IEnvelope public verifier;

    event EnvelopeCached(
        bytes32 indexed node,
        string method,
        bytes32 paramsHash,
        bytes32 digest,
        uint256 ttl
    );

    event CacheExpired(
        bytes32 indexed node,
        string method,
        bytes32 paramsHash
    );

    constructor(address _verifier) Ownable(msg.sender) {
        verifier = IEnvelope(_verifier);
    }

    /**
     * @notice Cache a verified envelope
     * @param node ENS node
     * @param envelope The verified envelope to cache
     * @param envelopeURI URI where full envelope can be retrieved
     */
    function cacheEnvelope(
        bytes32 node,
        IEnvelope.Envelope calldata envelope,
        string calldata envelopeURI,
        address signer
    ) external {
        // Verify envelope before caching
        require(
            verifier.verifyEnvelope(envelope, signer),
            "L2Cache: invalid envelope"
        );

        // Compute params hash for indexing
        bytes32 paramsHash = keccak256(abi.encodePacked(envelope.params, envelope.cursor));

        // Store in cache
        cache[node][envelope.method][paramsHash] = CachedEnvelope({
            digest: envelope.digest,
            timestamp: block.timestamp,
            ttl: envelope.cacheTtl,
            envelopeURI: envelopeURI,
            exists: true
        });

        emit EnvelopeCached(node, envelope.method, paramsHash, envelope.digest, envelope.cacheTtl);
    }

    /**
     * @notice Get cached envelope if valid
     * @param node ENS node
     * @param method Compute method
     * @param paramsHash Hash of params + cursor
     * @return cached The cached envelope data
     * @return valid Whether the cache entry is still valid (not expired)
     */
    function getCached(
        bytes32 node,
        string calldata method,
        bytes32 paramsHash
    ) external view returns (CachedEnvelope memory cached, bool valid) {
        cached = cache[node][method][paramsHash];
        if (!cached.exists) {
            return (cached, false);
        }

        // Check if expired
        valid = (block.timestamp - cached.timestamp) <= cached.ttl;
        return (cached, valid);
    }

    /**
     * @notice Check if a digest is cached and valid
     * @param node ENS node
     * @param method Compute method
     * @param paramsHash Hash of params + cursor
     * @param digest Expected digest
     * @return isCached Whether the digest matches a valid cache entry
     */
    function isDigestCached(
        bytes32 node,
        string calldata method,
        bytes32 paramsHash,
        bytes32 digest
    ) external view returns (bool isCached) {
        CachedEnvelope memory cached = cache[node][method][paramsHash];
        if (!cached.exists) {
            return false;
        }
        if ((block.timestamp - cached.timestamp) > cached.ttl) {
            return false;
        }
        return cached.digest == digest;
    }

    /**
     * @notice Update verifier contract
     */
    function setVerifier(address _verifier) external onlyOwner {
        verifier = IEnvelope(_verifier);
    }
}

