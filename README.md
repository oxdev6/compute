# ⚡ ENS Compute: "Resolution as Computation"

> **Normal ENS** maps a name (like `vitalik.eth`) to **data**: an address, a content hash, or a text record.  
> **ENS Compute** imagines a world where a name instead maps to a **verifiable computation endpoint** — something that runs a deterministic function off-chain and returns a signed, verifiable result.

## 🎯 Vision

Instead of:
```
pricefeed.eth → 0x1234... (address)
```

ENS Compute enables:
```
pricefeed.eth → { "ETH/USD": 3120.23, signature: ... }
```

**Resolution becomes not just lookup, but computation.**

## 🧩 Core Mechanism

ENS Compute leverages **EIP-3668 (CCIP-Read)** to enable off-chain resolution:

1. **On-chain resolver** triggers off-chain lookup via `OffchainLookup` error
2. **Off-chain gateway** executes deterministic computation
3. **Gateway signs** the result with cryptographic proof
4. **On-chain verifier** validates the signature before returning result

This turns ENS into a **decentralized FaaS (Function-as-a-Service)** fabric:
> "Compute endpoints, addressable by human-readable names, with verifiable outputs."

## 🏗️ Architecture

```
Client (wallet, dapp)
    ↓
ENS lookup for `pricefeed.eth`
    ↓
On-chain ENS resolver (ComputeResolver)
    ↓
Triggers CCIP-Read → Off-chain gateway
    ↓
Gateway executes compute function (e.g., getPrice())
    ↓
Signs result + proof
    ↓
Returns to on-chain resolver
    ↓
Verifier contract checks signature
    ↓
Result usable in smart contract logic
```

## 📁 Project Structure

```
ENS Compute/
├── contracts/              # Smart contracts
│   ├── ComputeResolver.sol # Main resolver with CCIP-Read
│   ├── EnvelopeVerifier.sol # Canonical envelope verification
│   ├── L2Cache.sol        # L2 caching contract
│   ├── Verifier.sol       # Signature verification
│   ├── Billing.sol        # Payment & subscriptions
│   └── interfaces/        # Contract interfaces
├── gateway/                # Off-chain gateway server
│   ├── server.js          # Express server
│   ├── compute/           # Compute functions
│   ├── middleware/        # Rate limiting, validation
│   ├── monitoring/        # Metrics & observability
│   ├── billing/           # Billing API
│   └── utils/             # Envelope, signing utilities
├── sdk/                    # TypeScript SDK
│   └── src/
├── ui/                     # Next.js web UI
│   └── src/app/
├── cli/                    # CLI tool
├── scripts/               # Deployment scripts
├── test/                  # Tests
└── examples/              # Example clients
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Hardhat
- An Ethereum wallet with testnet ETH (for deployment)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Gateway Configuration
GATEWAY_PRIVATE_KEY=0x...  # Private key for signing results
PORT=3000

# Ethereum Network
SEPOLIA_RPC_URL=https://...
PRIVATE_KEY=0x...  # Deployer private key
```

### Deploy Contracts

```bash
# Compile contracts
npm run compile

# Deploy to local network
npx hardhat node  # In one terminal
npm run deploy    # In another terminal
```

### Run Gateway

```bash
npm run gateway
```

The gateway will start on `http://localhost:3000`

### Test

```bash
npm test
```

### Start UI

```bash
cd ui && npm install && npm run dev
```

The UI will start on `http://localhost:3001`

### Use CLI

```bash
npm run cli call pricefeed.eth getPrice --params '{"pair":"ETH/USD"}'
```

## 💡 Example Compute Functions

### 1. Price Feed (`pricefeed.eth`)

Fetches cryptocurrency prices from CoinGecko:

```javascript
// Direct gateway call
const result = await directCompute('pricefeed', { pair: 'ethereum' });
// Returns: { pair: "ETHEREUM/USD", price: 3120.23, timestamp: ... }
```

### 2. DAO Votes (`dao.votes.eth`)

Queries DAO voting data:

```javascript
const result = await directCompute('daovotes', { daoId: 'example-dao' });
// Returns: { totalVotes, yesVotes, noVotes, quorumMet, yesRatio, ... }
```

### 3. NFT Floor Price (`nftfloor.eth`)

Computes NFT collection floor prices:

```javascript
const result = await directCompute('nftfloor', { collection: 'bored-ape' });
// Returns: { floorPrice, currency, volume24h, listings, ... }
```

## 🔧 Usage

### Setting Up an ENS Name

1. **Deploy contracts:**
   ```bash
   npm run deploy
   ```

2. **Set gateway URL:**
   ```solidity
   resolver.setGatewayURL(namehash("pricefeed.eth"), "http://your-gateway.com/lookup");
   ```

3. **Set authorized signer:**
   ```solidity
   resolver.setSigner(namehash("pricefeed.eth"), gatewaySignerAddress);
   ```

4. **Configure ENS:**
   Set your domain's resolver to the `ComputeResolver` address.

### Resolving a Name

```javascript
const { resolveCompute } = require('./examples/client');

// Resolve via CCIP-Read
const result = await resolveCompute('pricefeed.eth', 'pricefeed', { pair: 'ethereum' });
console.log(result);
```

### Adding Custom Compute Functions

1. Create a new file in `gateway/compute/`:

```javascript
// gateway/compute/myfunction.js
async function compute(params = {}) {
  // Your computation logic
  return {
    success: true,
    data: { /* your result */ },
    type: 'myfunction',
  };
}

module.exports = { compute };
```

2. Register it in `gateway/compute/index.js`:

```javascript
const myfunction = require('./myfunction');
const computeFunctions = {
  // ... existing functions
  myfunction: myfunction.compute,
};
```

## 🔐 Security

- **Signature Verification**: All results are signed using EIP-191 and verified on-chain
- **Authorized Signers**: Only pre-configured addresses can sign valid results
- **Deterministic Functions**: Compute functions should be deterministic for verifiability
- **Gateway Security**: Protect your gateway private key; consider using hardware wallets or key management services
- **Rate Limiting**: Built-in rate limiting (100 req/min per IP, 1000 req/min per API key)
- **Input Validation**: All inputs are validated and sanitized
- **Error Boundaries**: React error boundaries for graceful error handling

## 🌉 Extensions & Future Ideas

- **ZK-based resolvers**: Use zk-SNARKs for trustless verification
- **AI inference resolvers**: Verifiable AI model outputs
- **L2/L3 caching**: Store results in OP Stack or EigenDA
- **Resolver marketplaces**: Pay-per-query compute resolvers
- **Composable functions**: `foo.eth/bar/baz` syntax for parameterized calls

## 📚 Technical Details

### CCIP-Read (EIP-3668)

The resolver uses `OffchainLookup` error to trigger off-chain resolution:

```solidity
revert OffchainLookup(
    address(this),
    urls,
    callData,
    this.resolveWithProof.selector,
    extraData
);
```

### Canonical Envelope Format

Results use a canonical envelope with deterministic digest:

```json
{
  "name": "pricefeed.eth",
  "method": "getPrice",
  "params": "[\"ETH\",\"USD\"]",
  "result": "{...}",
  "cursor": null,
  "prev_digest": null,
  "meta": "{...}",
  "cache_ttl": 30,
  "digest": "0x...",
  "signature": "0x..."
}
```

### Signature Format

Results are signed using EIP-191:
```
keccak256("\x19Ethereum Signed Message:\n32" + keccak256(data))
```

### Cursor Pagination

Large result sets use cursor-based pagination with digest chaining for verification.

## 🚢 Deployment

### Docker

```bash
docker-compose up -d
```

### Production Checklist

- [ ] Set secure `GATEWAY_PRIVATE_KEY` (use HSM/KMS)
- [ ] Configure rate limits
- [ ] Set up monitoring (Prometheus metrics available at `/metrics`)
- [ ] Deploy contracts to mainnet
- [ ] Configure ENS resolver
- [ ] Set up L2 cache (optional)

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional compute functions
- ZK proof integration
- Performance optimizations
- Better error handling
- Documentation improvements

## 📄 License

MIT

## 🙏 Acknowledgments

- ENS (Ethereum Name Service)
- EIP-3668 (CCIP-Read)
- The Ethereum community

---

**ENS Compute** = DNS + Lambda + Oracle layer, rolled into one.

Transform ENS names into verifiable computation endpoints. 🚀

