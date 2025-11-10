/**
 * Canonical Envelope Utilities
 * Creates and signs canonical compute result envelopes
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * Creates a canonical JSON string from an object (deterministic key ordering)
 * @param {Object} obj - Object to canonicalize
 * @returns {string} Canonical JSON string
 */
function canonicalizeJSON(obj) {
  // Sort keys alphabetically
  const sorted = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  
  return JSON.stringify(sorted);
}

/**
 * Computes the digest of an envelope (excluding the digest field itself)
 * @param {Object} envelope - Envelope object
 * @returns {string} Hex-encoded digest
 */
function computeDigest(envelope) {
  // Create canonical JSON without digest field
  const { digest, signature, ...envelopeForDigest } = envelope;
  
  // Canonical format matches Solidity implementation
  const canonical = {
    cache_ttl: envelope.cache_ttl || 0,
    cursor: envelope.cursor || null,
    meta: envelope.meta || '',
    method: envelope.method || '',
    name: envelope.name || '',
    params: envelope.params || '',
    prev_digest: envelope.prev_digest || null,
    result: envelope.result || '',
  };
  
  const json = canonicalizeJSON(canonical);
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

/**
 * Creates a signed envelope from computation result
 * @param {Object} params - Envelope parameters
 * @param {ethers.Wallet} wallet - Signing wallet
 * @returns {Promise<Object>} Complete envelope with digest and signature
 */
async function createEnvelope(params, wallet) {
  const {
    name,
    method,
    params: methodParams,
    result,
    cursor = null,
    prevDigest = null,
    meta = {},
    cacheTtl = 30,
  } = params;

  // Create envelope without digest/signature
  const envelope = {
    name,
    method,
    params: typeof methodParams === 'string' ? methodParams : JSON.stringify(methodParams),
    result: typeof result === 'string' ? result : JSON.stringify(result),
    cursor: cursor || null,
    prev_digest: prevDigest || null,
    meta: typeof meta === 'string' ? meta : JSON.stringify(meta),
    cache_ttl: cacheTtl,
  };

  // Compute digest
  const digest = computeDigest(envelope);
  envelope.digest = digest;

  // Sign digest using EIP-191
  const messageHash = ethers.keccak256(
    ethers.concat([
      ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n32'),
      ethers.getBytes(digest)
    ])
  );

  const signature = wallet.signingKey.sign(messageHash);
  envelope.signature = ethers.concat([
    signature.r,
    signature.s,
    ethers.toBeHex(signature.v, 1)
  ]);

  return envelope;
}

/**
 * Verifies an envelope's signature
 * @param {Object} envelope - Envelope to verify
 * @param {string} expectedSigner - Expected signer address
 * @returns {boolean} Whether signature is valid
 */
function verifyEnvelope(envelope, expectedSigner) {
  // Recompute digest
  const computedDigest = computeDigest(envelope);
  if (computedDigest !== envelope.digest) {
    return false;
  }

  // Verify signature
  const messageHash = ethers.keccak256(
    ethers.concat([
      ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n32'),
      ethers.getBytes(envelope.digest)
    ])
  );

  try {
    const sig = ethers.Signature.from(envelope.signature);
    const recoveredSigner = ethers.recoverAddress(messageHash, sig);
    return recoveredSigner.toLowerCase() === expectedSigner.toLowerCase();
  } catch (e) {
    return false;
  }
}

module.exports = {
  createEnvelope,
  computeDigest,
  verifyEnvelope,
  canonicalizeJSON,
};

