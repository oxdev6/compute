/**
 * Setup script for ENS Compute
 * Helps configure a new ENS name with compute resolver
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("ENS Compute Setup\n");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract addresses (you'll need to update these after deployment)
  const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS || "0x...";
  const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000/lookup";
  const GATEWAY_SIGNER = process.env.GATEWAY_SIGNER || "0x...";
  
  if (RESOLVER_ADDRESS === "0x...") {
    console.log("⚠️  Please set RESOLVER_ADDRESS in .env");
    console.log("   Run 'npm run deploy' first to get the address\n");
    return;
  }
  
  if (GATEWAY_SIGNER === "0x...") {
    console.log("⚠️  Please set GATEWAY_SIGNER in .env");
    console.log("   This should be the address of your gateway's signing wallet\n");
    return;
  }

  const ComputeResolver = await hre.ethers.getContractFactory("ComputeResolver");
  const resolver = ComputeResolver.attach(RESOLVER_ADDRESS);

  // Example: Setup for "pricefeed.eth"
  const name = process.env.ENS_NAME || "pricefeed.eth";
  const node = ethers.namehash(name);
  
  console.log(`Setting up: ${name}`);
  console.log(`Node (namehash): ${node}\n`);

  // Set gateway URL
  console.log("1. Setting gateway URL...");
  try {
    const tx1 = await resolver.setGatewayURL(node, GATEWAY_URL);
    await tx1.wait();
    console.log("   ✓ Gateway URL set:", GATEWAY_URL);
  } catch (error) {
    console.error("   ✗ Error setting gateway URL:", error.message);
    return;
  }

  // Set authorized signer
  console.log("\n2. Setting authorized signer...");
  try {
    const tx2 = await resolver.setSigner(node, GATEWAY_SIGNER);
    await tx2.wait();
    console.log("   ✓ Signer set:", GATEWAY_SIGNER);
  } catch (error) {
    console.error("   ✗ Error setting signer:", error.message);
    return;
  }

  // Verify configuration
  console.log("\n3. Verifying configuration...");
  const gatewayURL = await resolver.getGatewayURL(node);
  const signer = await resolver.authorizedSigners(node);
  
  console.log("   Gateway URL:", gatewayURL);
  console.log("   Authorized Signer:", signer);

  console.log("\n✅ Setup complete!");
  console.log("\nNext steps:");
  console.log("1. Configure ENS to use this resolver for", name);
  console.log("2. Start the gateway: npm run gateway");
  console.log("3. Test resolution: node examples/client.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

