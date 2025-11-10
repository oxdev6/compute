/**
 * Signing utilities for computation results
 * Uses Ethereum message signing (EIP-191)
 */

const { ethers } = require('ethers');

/**
 * Signs computation result data using EIP-191 standard
 * Matches the Verifier contract's verification logic exactly:
 * keccak256("\x19Ethereum Signed Message:\n32" + keccak256(data))
 * @param {string} dataBytes - The computation result as bytes (hex string)
 * @param {ethers.Wallet} wallet - The wallet to sign with
 * @returns {Promise<string>} Hex-encoded signature (65 bytes: r, s, v)
 */
async function signData(dataBytes, wallet) {
  // The Verifier contract computes: keccak256("\x19Ethereum Signed Message:\n32" + keccak256(data))
  // We need to create this exact hash and sign it
  
  // Step 1: Hash the data
  const dataHash = ethers.keccak256(dataBytes);
  
  // Step 2: Create the EIP-191 message hash
  // Format: "\x19Ethereum Signed Message:\n32" + hash (32 bytes)
  const prefix = "\x19Ethereum Signed Message:\n32";
  const messageHash = ethers.keccak256(
    ethers.concat([
      ethers.toUtf8Bytes(prefix),
      ethers.getBytes(dataHash)
    ])
  );
  
  // Step 3: Sign the message hash directly
  const signature = wallet.signingKey.sign(messageHash);
  
  // Step 4: Serialize to 65-byte format (r, s, v)
  // Format: r (32 bytes) + s (32 bytes) + v (1 byte)
  const r = signature.r;
  const s = signature.s;
  const v = signature.v;
  
  return ethers.concat([r, s, ethers.toBeHex(v, 1)]);
}

/**
 * Signs computation result and returns signature
 * @param {Object} result - The computation result
 * @param {ethers.Wallet} wallet - The wallet to sign with
 * @returns {Promise<string>} Hex-encoded signature
 */
async function signResult(result, wallet) {
  // Convert result to bytes (UTF-8 encoded JSON)
  const resultJson = JSON.stringify(result);
  const dataBytes = ethers.toUtf8Bytes(resultJson);
  
  // Sign the data bytes
  const signature = await signData(dataBytes, wallet);
  return signature;
}

module.exports = {
  signData,
  signResult,
};

