# Quick Start Guide

Get ENS Compute up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file:

```bash
# Gateway Configuration
GATEWAY_PRIVATE_KEY=0x...  # Generate with: node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
PORT=3000

# Ethereum Network (for deployment)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...  # Your deployer private key
```

## Step 3: Deploy Contracts (Local)

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy
```

Save the contract addresses from the output.

## Step 4: Start Gateway

```bash
npm run gateway
```

The gateway will start on `http://localhost:3000`

## Step 5: Test Direct Computation

In a new terminal:

```bash
npm run client
```

This will test the gateway directly without CCIP-Read.

## Step 6: Setup ENS Name (Optional)

If you want to test the full CCIP-Read flow:

1. Update `.env` with your contract addresses:
   ```bash
   RESOLVER_ADDRESS=0x...
   GATEWAY_SIGNER=0x...  # Address of GATEWAY_PRIVATE_KEY
   GATEWAY_URL=http://localhost:3000/lookup
   ENS_NAME=pricefeed.eth
   ```

2. Run setup:
   ```bash
   npm run setup
   ```

3. Configure ENS (requires ENS domain):
   - Set your domain's resolver to the `ComputeResolver` address
   - This typically requires using an ENS manager dApp

## Example: Testing Price Feed

```bash
# Direct gateway call
curl -X POST http://localhost:3000/compute \
  -H "Content-Type: application/json" \
  -d '{"function": "pricefeed", "params": {"pair": "ethereum"}}'
```

Expected response:
```json
{
  "result": {
    "success": true,
    "data": {
      "pair": "ETHEREUM/USD",
      "price": 3120.23,
      "timestamp": 1234567890
    },
    "type": "pricefeed"
  },
  "signature": "0x...",
  "signer": "0x..."
}
```

## Troubleshooting

### "No gateway URL set for node"
- Run `npm run setup` to configure the resolver
- Make sure you've set the gateway URL for your ENS node

### "Invalid signature"
- Verify `GATEWAY_SIGNER` matches the address of `GATEWAY_PRIVATE_KEY`
- Check that the gateway is using the correct private key

### "Connection refused"
- Make sure the gateway is running: `npm run gateway`
- Check the port in `.env` matches the gateway port

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Add your own compute functions in `gateway/compute/`
- Deploy to testnet/mainnet for production use
- Check out the TypeScript SDK in `sdk/`
- Explore the web UI: `cd ui && npm run dev`

Happy computing! 🚀

