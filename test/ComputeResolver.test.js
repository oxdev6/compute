const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ENS Compute", function () {
  let verifier, resolver;
  let owner, signer;
  let gatewayWallet;

  beforeEach(async function () {
    [owner, signer] = await ethers.getSigners();
    
    // Create a gateway wallet for signing
    gatewayWallet = ethers.Wallet.createRandom();

    // Deploy Verifier
    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();

    // Deploy ComputeResolver
    const ComputeResolver = await ethers.getContractFactory("ComputeResolver");
    resolver = await ComputeResolver.deploy(await verifier.getAddress());
  });

  describe("Verifier", function () {
    it("Should verify valid signatures", async function () {
      const data = ethers.toUtf8Bytes(JSON.stringify({ price: 3120.23 }));
      const dataHash = ethers.keccak256(data);
      const signature = await gatewayWallet.signMessage(ethers.getBytes(dataHash));
      
      const isValid = await verifier.verify(
        data,
        signature,
        gatewayWallet.address
      );
      
      expect(isValid).to.be.true;
    });

    it("Should reject invalid signatures", async function () {
      const data = ethers.toUtf8Bytes(JSON.stringify({ price: 3120.23 }));
      const wrongData = ethers.toUtf8Bytes(JSON.stringify({ price: 9999.99 }));
      const dataHash = ethers.keccak256(data);
      const signature = await gatewayWallet.signMessage(ethers.getBytes(dataHash));
      
      const isValid = await verifier.verify(
        wrongData,
        signature,
        gatewayWallet.address
      );
      
      expect(isValid).to.be.false;
    });
  });

  describe("ComputeResolver", function () {
    const testNode = ethers.namehash("pricefeed.eth");
    const gatewayURL = "http://localhost:3000/lookup";

    it("Should set gateway URL", async function () {
      await resolver.setGatewayURL(testNode, gatewayURL);
      expect(await resolver.getGatewayURL(testNode)).to.equal(gatewayURL);
    });

    it("Should set authorized signer", async function () {
      await resolver.setSigner(testNode, gatewayWallet.address);
      expect(await resolver.authorizedSigners(testNode)).to.equal(gatewayWallet.address);
    });

    it("Should revert with OffchainLookup when resolving", async function () {
      await resolver.setGatewayURL(testNode, gatewayURL);
      
      // resolve() should revert with OffchainLookup error
      await expect(
        resolver.resolve(testNode, "0x")
      ).to.be.revertedWithCustomError(resolver, "OffchainLookup");
    });

    it("Should verify and return result with valid signature", async function () {
      const testResult = { price: 3120.23, pair: "ETH/USD" };
      const resultBytes = ethers.toUtf8Bytes(JSON.stringify(testResult));
      const dataHash = ethers.keccak256(resultBytes);
      const signature = await gatewayWallet.signMessage(ethers.getBytes(dataHash));
      
      await resolver.setSigner(testNode, gatewayWallet.address);
      
      const response = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes", "bytes"],
        [resultBytes, signature]
      );
      
      const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32"],
        [testNode]
      );
      
      const returnedResult = await resolver.resolveWithProof(response, extraData);
      expect(ethers.toUtf8String(returnedResult)).to.equal(JSON.stringify(testResult));
    });

    it("Should reject result with invalid signature", async function () {
      const testResult = { price: 3120.23 };
      const resultBytes = ethers.toUtf8Bytes(JSON.stringify(testResult));
      const wrongSignature = "0x" + "00".repeat(65);
      
      await resolver.setSigner(testNode, gatewayWallet.address);
      
      const response = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes", "bytes"],
        [resultBytes, wrongSignature]
      );
      
      const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32"],
        [testNode]
      );
      
      await expect(
        resolver.resolveWithProof(response, extraData)
      ).to.be.revertedWith("ComputeResolver: invalid signature");
    });
  });
});

