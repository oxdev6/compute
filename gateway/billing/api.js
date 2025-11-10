/**
 * Billing API
 * Handles payment verification and access control
 */

const { ethers } = require('ethers');

class BillingAPI {
  constructor(provider, billingContractAddress, billingABI) {
    this.provider = provider;
    this.billing = new ethers.Contract(billingContractAddress, billingABI, provider);
  }

  /**
   * Check if an address has access to an endpoint
   * @param {string} node ENS node (namehash)
   * @param {string} callerAddress Caller address
   * @returns {Promise<boolean>} Whether caller has access
   */
  async hasAccess(node, callerAddress) {
    try {
      return await this.billing.hasAccess(node, callerAddress);
    } catch (error) {
      console.error('Billing check error:', error);
      return false;
    }
  }

  /**
   * Get price for an endpoint
   * @param {string} node ENS node
   * @returns {Promise<{price: string, token: string}>} Price and token address
   */
  async getPrice(node) {
    try {
      const price = await this.billing.prices(node);
      const token = await this.billing.paymentTokens(node);
      return {
        price: price.toString(),
        token: token,
      };
    } catch (error) {
      console.error('Get price error:', error);
      return { price: '0', token: ethers.ZeroAddress };
    }
  }

  /**
   * Record a payment (called after successful payment on-chain)
   * @param {string} payer Payer address
   * @param {string} node ENS node
   * @param {string} method Method name
   */
  async recordPayment(payer, node, method) {
    // This would typically be called by the resolver or a payment processor
    // For now, we just log it
    console.log('Payment recorded:', { payer, node, method });
  }
}

module.exports = BillingAPI;

