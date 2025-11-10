/**
 * Example client for interacting with ENS Compute
 * Demonstrates how to resolve an ENS name to a computation result
 */

const { ethers } = require('ethers');
const axios = require('axios');

// Configuration
const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS || '0x...'; // Your ComputeResolver address
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';

/**
 * Resolves an ENS name to a computation result via CCIP-Read
 * @param {string} name - ENS name (e.g., "pricefeed.eth")
 * @param {string} functionName - Compute function to execute
 * @param {Object} params - Parameters for the computation
 * @returns {Promise<Object>} The computation result
 */
async function resolveCompute(name, functionName = 'pricefeed', params = {}) {
  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Get the resolver contract
  const resolverABI = [
    "function resolve(bytes32 node, bytes calldata data) external view returns (bytes memory)",
    "function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)",
  ];
  const resolver = new ethers.Contract(RESOLVER_ADDRESS, resolverABI, provider);
  
  // Compute namehash
  const node = ethers.namehash(name);
  
  // Encode the function call data
  const callData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['string', 'bytes'],
    [functionName, ethers.toUtf8Bytes(JSON.stringify(params))]
  );
  
  try {
    // Call resolve - this will trigger CCIP-Read
    const result = await resolver.resolve(node, callData);
    return JSON.parse(ethers.toUtf8String(result));
  } catch (error) {
    // Check if it's an OffchainLookup error
    if (error.data && error.data.selector === '0x556f1830') {
      // Parse the OffchainLookup error data
      const [sender, urls, callData, callbackFunction, extraData] = 
        ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'string[]', 'bytes', 'bytes4', 'bytes'],
          error.data.slice(10) // Remove selector
        );
      
      // Fetch from gateway
      const gatewayResponse = await axios.post(`${GATEWAY_URL}/lookup`, {
        node: node,
        data: callData,
      });
      
      // Call resolveWithProof
      const verifiedResult = await resolver.resolveWithProof(
        gatewayResponse.data.data,
        extraData
      );
      
      return JSON.parse(ethers.toUtf8String(verifiedResult));
    }
    throw error;
  }
}

/**
 * Direct gateway call (for testing without CCIP-Read)
 */
async function directCompute(functionName, params = {}) {
  const response = await axios.post(`${GATEWAY_URL}/compute`, {
    function: functionName,
    params: params,
  });
  
  return response.data;
}

// Example usage
async function main() {
  console.log('ENS Compute Client Examples\n');
  
  // Example 1: Direct gateway call
  console.log('1. Direct gateway call (pricefeed):');
  try {
    const result1 = await directCompute('pricefeed', { pair: 'ethereum' });
    console.log('Result:', JSON.stringify(result1.result, null, 2));
    console.log('Signer:', result1.signer);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Example 2: DAO votes
  console.log('2. Direct gateway call (daovotes):');
  try {
    const result2 = await directCompute('daovotes', { daoId: 'example-dao' });
    console.log('Result:', JSON.stringify(result2.result, null, 2));
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Example 3: NFT floor price
  console.log('3. Direct gateway call (nftfloor):');
  try {
    const result3 = await directCompute('nftfloor', { collection: 'bored-ape' });
    console.log('Result:', JSON.stringify(result3.result, null, 2));
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Example 4: Full CCIP-Read resolution (requires deployed contracts)
  if (RESOLVER_ADDRESS !== '0x...') {
    console.log('4. Full CCIP-Read resolution:');
    try {
      const result4 = await resolveCompute('pricefeed.eth', 'pricefeed', { pair: 'ethereum' });
      console.log('Result:', JSON.stringify(result4, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      console.log('(Make sure contracts are deployed and gateway is running)');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { resolveCompute, directCompute };

