/**
 * Input Validation Middleware
 * Validates and sanitizes request inputs
 */

const { ethers } = require('ethers');

/**
 * Validate ENS name
 */
function isValidENSName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Basic ENS name validation
  // Must end with .eth and contain only alphanumeric and hyphens
  const ensRegex = /^[a-z0-9-]+\.eth$/i;
  return ensRegex.test(name) && name.length <= 255;
}

/**
 * Validate node (namehash)
 */
function isValidNode(node) {
  if (!node) return false;
  
  // Check if it's a valid bytes32
  try {
    if (typeof node === 'string') {
      if (node.startsWith('0x')) {
        return node.length === 66; // 0x + 64 hex chars
      }
      // Try to compute namehash
      ethers.namehash(node);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input
 */
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate request body
 */
function validateRequest(req, res, next) {
  const errors = [];

  // Validate node if present
  if (req.body.node) {
    if (!isValidNode(req.body.node)) {
      errors.push('Invalid node parameter');
    }
  }

  // Validate name if present
  if (req.body.name) {
    const name = sanitizeString(req.body.name, 255);
    if (!isValidENSName(name)) {
      errors.push('Invalid ENS name');
    }
    req.body.name = name; // Use sanitized version
  }

  // Validate data size
  if (req.body.data) {
    const dataSize = JSON.stringify(req.body.data).length;
    if (dataSize > 100000) { // 100KB limit
      errors.push('Request data too large (max 100KB)');
    }
  }

  // Validate params
  if (req.body.params) {
    if (typeof req.body.params !== 'object') {
      errors.push('Params must be an object');
    } else {
      // Sanitize param values
      for (const key in req.body.params) {
        if (typeof req.body.params[key] === 'string') {
          req.body.params[key] = sanitizeString(req.body.params[key], 1000);
        }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
}

module.exports = {
  validateRequest,
  isValidENSName,
  isValidNode,
  sanitizeString,
};

