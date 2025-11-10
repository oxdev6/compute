/**
 * Deployment script for ENS Compute contracts
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy Verifier
  console.log("\nDeploying Verifier...");
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Verifier deployed to:", verifierAddress);

  // Deploy EnvelopeVerifier
  console.log("\nDeploying EnvelopeVerifier...");
  const EnvelopeVerifier = await hre.ethers.getContractFactory("EnvelopeVerifier");
  const envelopeVerifier = await EnvelopeVerifier.deploy();
  await envelopeVerifier.waitForDeployment();
  const envelopeVerifierAddress = await envelopeVerifier.getAddress();
  console.log("EnvelopeVerifier deployed to:", envelopeVerifierAddress);

  // Deploy ComputeResolver
  console.log("\nDeploying ComputeResolver...");
  const ComputeResolver = await hre.ethers.getContractFactory("ComputeResolver");
  const resolver = await ComputeResolver.deploy(verifierAddress, envelopeVerifierAddress);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("ComputeResolver deployed to:", resolverAddress);

  // Deploy L2Cache (optional)
  console.log("\nDeploying L2Cache...");
  const L2Cache = await hre.ethers.getContractFactory("L2Cache");
  const l2Cache = await L2Cache.deploy(envelopeVerifierAddress);
  await l2Cache.waitForDeployment();
  const l2CacheAddress = await l2Cache.getAddress();
  console.log("L2Cache deployed to:", l2CacheAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Verifier:", verifierAddress);
  console.log("EnvelopeVerifier:", envelopeVerifierAddress);
  console.log("ComputeResolver:", resolverAddress);
  console.log("L2Cache:", l2CacheAddress);
  console.log("\nNext steps:");
  console.log("1. Set gateway URL: resolver.setGatewayURL(node, 'http://your-gateway.com/lookup')");
  console.log("2. Set authorized signer: resolver.setSigner(node, gatewaySignerAddress)");
  console.log("3. Optionally set L2 cache: resolver.setL2Cache('" + l2CacheAddress + "')");
  console.log("4. Configure ENS to use this resolver for your domain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

