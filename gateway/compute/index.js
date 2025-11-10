/**
 * Compute Functions Registry
 * Maps compute function names to their implementations
 */

const pricefeed = require('./pricefeed');
const daovotes = require('./daovotes');
const nftfloor = require('./nftfloor');

const computeFunctions = {
  pricefeed: pricefeed.compute,
  daovotes: daovotes.compute,
  nftfloor: nftfloor.compute,
};

/**
 * Executes a compute function by name
 * @param {string} functionName - Name of the compute function
 * @param {Object} params - Parameters for the computation
 * @returns {Promise<Object>} Computation result
 */
async function executeCompute(functionName, params = {}) {
  const computeFn = computeFunctions[functionName];
  
  if (!computeFn) {
    throw new Error(`Unknown compute function: ${functionName}`);
  }
  
  return await computeFn(params);
}

/**
 * Lists all available compute functions
 * @returns {string[]} Array of function names
 */
function listFunctions() {
  return Object.keys(computeFunctions);
}

module.exports = {
  executeCompute,
  listFunctions,
  computeFunctions,
};

