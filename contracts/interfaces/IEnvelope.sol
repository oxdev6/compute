// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEnvelope
 * @notice Interface for canonical compute result envelopes
 * @dev Envelopes follow a deterministic JSON structure for verification
 */
interface IEnvelope {
    /**
     * @notice Canonical envelope structure
     * @param name ENS name (e.g., "pricefeed.eth")
     * @param method Compute method name (e.g., "getPrice")
     * @param params Method parameters (JSON array)
     * @param result Computation result (JSON object)
     * @param cursor Pagination cursor (null or opaque string)
     * @param prevDigest Previous page digest for chaining (null for first page)
     * @param meta Metadata (provider, version, nonce, etc.)
     * @param cacheTtl Cache TTL in seconds
     * @param digest Keccak256 hash of canonical JSON
     * @param signature ECDSA signature over digest
     */
    struct Envelope {
        string name;
        string method;
        string params;
        string result;
        string cursor;
        bytes32 prevDigest;
        string meta;
        uint256 cacheTtl;
        bytes32 digest;
        bytes signature;
    }

    /**
     * @notice Verifies an envelope's signature and digest
     * @param envelope The envelope to verify
     * @param signer Expected signer address
     * @return valid Whether the envelope is valid
     */
    function verifyEnvelope(Envelope calldata envelope, address signer)
        external
        pure
        returns (bool valid);
}

