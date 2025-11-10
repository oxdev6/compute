/**
 * ENS Compute Gateway Server
 * Handles CCIP-Read requests and executes verifiable computations
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { executeCompute } = require('./compute');
const { signResult } = require('./utils/signer');
const { createEnvelope } = require('./utils/envelope');
const metrics = require('./monitoring/metrics');
const { rateLimitMiddleware } = require('./middleware/rateLimit');
const { validateRequest } = require('./middleware/validation');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' })); // Limit request size

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// Load environment variables
require('dotenv').config();

// Initialize signer wallet
const PRIVATE_KEY = process.env.GATEWAY_PRIVATE_KEY || '0x' + '0'.repeat(64);
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('Gateway signer address:', wallet.address);

/**
 * CCIP-Read endpoint
 * Handles off-chain lookup requests from the resolver
 */
app.post('/lookup', validateRequest, async (req, res) => {
  const startTime = Date.now();
  try {
    const { node, data } = req.body;
    
    if (!node) {
      return res.status(400).json({ error: 'Missing node parameter' });
    }
    
    // Decode the call data to extract function name and parameters
    // In a real implementation, you'd decode based on your ABI
    let functionName = 'pricefeed'; // Default
    let params = {};
    
    if (data && (typeof data === 'string' ? data.length > 0 : Object.keys(data).length > 0)) {
      try {
        // Try to decode as ABI-encoded data
        // Format: ['string', 'bytes'] where bytes contains JSON-encoded params
        if (typeof data === 'string' && data.startsWith('0x')) {
          // Decode ABI-encoded data
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ['string', 'bytes'],
            data
          );
          functionName = decoded[0] || functionName;
          const paramsBytes = decoded[1];
          if (paramsBytes && paramsBytes.length > 0) {
            try {
              params = JSON.parse(ethers.toUtf8String(paramsBytes));
            } catch (e) {
              console.warn('Could not parse params JSON:', e.message);
            }
          }
        } else if (typeof data === 'string') {
          // Assume it's JSON string
          const parsed = JSON.parse(data);
          functionName = parsed.function || functionName;
          params = parsed.params || {};
        } else if (typeof data === 'object') {
          // Already an object
          functionName = data.function || functionName;
          params = data.params || {};
        }
      } catch (e) {
        // If decoding fails, use defaults
        console.warn('Could not decode call data, using defaults:', e.message);
      }
    }
    
    // Execute the compute function
    const result = await executeCompute(functionName, params);
    
    // Check if envelope format is requested (default: true for new format)
    const useEnvelope = req.body.useEnvelope !== false;
    
    if (useEnvelope) {
      // Create canonical envelope
      const envelope = await createEnvelope({
        name: req.body.name || 'unknown.eth',
        method: functionName,
        params: params,
        result: result,
        cursor: params.cursor || null,
        prevDigest: params.prevDigest || null,
        meta: {
          provider: 'ens-compute-gateway',
          version: '1.0.0',
          nonce: Date.now(),
          timestamp: Math.floor(Date.now() / 1000),
        },
        cacheTtl: params.cacheTtl || 30,
      }, wallet);
      
      // Return ABI-encoded envelope
      const response = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(string,string,string,string,string,bytes32,string,uint256,bytes32,bytes)'],
        [[
          envelope.name,
          envelope.method,
          envelope.params,
          envelope.result,
          envelope.cursor || '',
          envelope.prev_digest || ethers.ZeroHash,
          envelope.meta,
          envelope.cache_ttl,
          envelope.digest,
          envelope.signature
        ]]
      );
      
    const latency = Date.now() - startTime;
    metrics.recordRequest(functionName, true, latency);
    metrics.recordSignatureGenerated();
    
    res.json({
      data: response,
      envelope: envelope, // Also return JSON for debugging
    });
    } else {
      // Legacy format
      const signature = await signResult(result, wallet);
      const response = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes', 'bytes'],
        [
          ethers.toUtf8Bytes(JSON.stringify(result)),
          signature
        ]
      );
      
      const latency = Date.now() - startTime;
      metrics.recordRequest(functionName, true, latency);
      metrics.recordSignatureGenerated();
      
      res.json({
        data: response,
      });
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    metrics.recordRequest(functionName || 'unknown', false, latency);
    console.error('Lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    signer: wallet.address,
    timestamp: Math.floor(Date.now() / 1000),
    uptime: process.uptime(),
  });
});

/**
 * Metrics endpoint (Prometheus format)
 */
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.toPrometheus());
});

/**
 * Metrics endpoint (JSON format)
 */
app.get('/api/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});

/**
 * List available compute functions
 */
app.get('/functions', (req, res) => {
  const { listFunctions } = require('./compute');
  res.json({
    functions: listFunctions(),
  });
});

/**
 * Test endpoint for direct computation (without CCIP-Read)
 */
app.post('/compute', validateRequest, async (req, res) => {
  try {
    const { function: functionName, params } = req.body;
    
    if (!functionName) {
      return res.status(400).json({ error: 'Missing function parameter' });
    }
    
    const result = await executeCompute(functionName, params || {});
    const signature = await signResult(result, wallet);
    
    res.json({
      result,
      signature,
      signer: wallet.address,
    });
  } catch (error) {
    console.error('Compute error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ENS Compute Gateway running on port ${PORT}`);
  console.log(`Signer address: ${wallet.address}`);
});

