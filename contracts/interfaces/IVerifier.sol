// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Interface for verifying off-chain computation results
 */
interface IVerifier {
    /**
     * @notice Verifies a signed computation result
     * @param data The computation result data
     * @param signature The signature over the data
     * @param signer The expected signer address
     * @return valid Whether the signature is valid
     */
    function verify(bytes memory data, bytes memory signature, address signer)
        external
        pure
        returns (bool valid);
}

