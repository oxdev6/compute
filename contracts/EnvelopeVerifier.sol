// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IEnvelope.sol";

/**
 * @title EnvelopeVerifier
 * @notice Verifies canonical compute envelopes with digest and signature validation
 * @dev Implements deterministic JSON canonicalization for digest computation
 */
contract EnvelopeVerifier is IEnvelope {
    /**
     * @notice Computes the canonical digest of an envelope
     * @dev Uses deterministic JSON ordering: keys sorted alphabetically
     * @param envelope The envelope to digest
     * @return digest The keccak256 hash of the canonical JSON
     */
    function computeDigest(Envelope calldata envelope) public pure returns (bytes32 digest) {
        // Canonical JSON: deterministic key ordering
        // Format: {"cache_ttl":...,"cursor":...,"digest":"0x...","meta":...,"method":...,"name":...,"params":...,"prev_digest":"0x...","result":...}
        // Note: digest field is excluded from self-digest computation
        bytes memory canonical = abi.encodePacked(
            '{"cache_ttl":',
            _uintToString(envelope.cacheTtl),
            ',"cursor":',
            envelope.cursor.length > 0 ? _quoteString(envelope.cursor) : 'null',
            ',"meta":',
            _quoteString(envelope.meta),
            ',"method":',
            _quoteString(envelope.method),
            ',"name":',
            _quoteString(envelope.name),
            ',"params":',
            _quoteString(envelope.params),
            ',"prev_digest":',
            envelope.prevDigest == bytes32(0) ? 'null' : _bytes32ToHexString(envelope.prevDigest),
            ',"result":',
            _quoteString(envelope.result),
            '}'
        );
        
        return keccak256(canonical);
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
        override
        returns (bool valid)
    {
        // Verify digest matches computed digest
        bytes32 computedDigest = computeDigest(envelope);
        if (computedDigest != envelope.digest) {
            return false;
        }

        // Verify signature using EIP-191
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", envelope.digest)
        );

        require(envelope.signature.length == 65, "EnvelopeVerifier: invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(envelope.signature, 32))
            s := mload(add(envelope.signature, 64))
            v := byte(0, mload(add(envelope.signature, 96)))
        }

        address recoveredSigner = ecrecover(messageHash, v, r, s);
        return recoveredSigner == signer && recoveredSigner != address(0);
    }

    // Helper functions for canonical JSON construction
    function _quoteString(string memory str) private pure returns (string memory) {
        return string(abi.encodePacked('"', str, '"'));
    }

    function _uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _bytes32ToHexString(bytes32 value) private pure returns (string memory) {
        bytes memory buffer = new bytes(66);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 0; i < 32; i++) {
            uint8 byteValue = uint8(value[i]);
            buffer[2 + i * 2] = _byteToHexChar(byteValue >> 4);
            buffer[3 + i * 2] = _byteToHexChar(byteValue & 0x0f);
        }
        return string(buffer);
    }

    function _byteToHexChar(uint8 byteValue) private pure returns (bytes1) {
        if (byteValue < 10) {
            return bytes1(byteValue + 48);
        } else {
            return bytes1(byteValue + 87);
        }
    }
}

