// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVerifier.sol";

/**
 * @title Verifier
 * @notice Verifies signed computation results using ECDSA
 * @dev Uses Ethereum message signing standard (EIP-191) for verification
 */
contract Verifier is IVerifier {
    /**
     * @notice Verifies a signed computation result
     * @param data The computation result data
     * @param signature The signature over the data (65 bytes: r, s, v)
     * @param signer The expected signer address
     * @return valid Whether the signature is valid for the given signer
     */
    function verify(bytes memory data, bytes memory signature, address signer)
        public
        pure
        override
        returns (bool valid)
    {
        require(signature.length == 65, "Verifier: invalid signature length");
        
        // Create Ethereum signed message hash (EIP-191)
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(data))
        );
        
        // Extract r, s, v from signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Recover signer from signature
        address recoveredSigner = ecrecover(messageHash, v, r, s);
        
        return recoveredSigner == signer && recoveredSigner != address(0);
    }
}

