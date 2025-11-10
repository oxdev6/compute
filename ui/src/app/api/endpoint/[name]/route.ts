import { NextResponse } from 'next/server'

const mockEndpoints: Record<string, any> = {
  'pricefeed.eth': {
    name: 'pricefeed.eth',
    method: 'getPrice',
    description: 'Real-time cryptocurrency price feeds from multiple sources',
    category: 'price',
    trustScore: 5,
    cost: 'Free',
    ttl: 30,
    lastUpdated: new Date().toISOString(),
    signer: '0x1234567890123456789012345678901234567890',
    gatewayURL: process.env.GATEWAY_URL || 'http://localhost:3000',
    sampleResult: { pair: 'ETH/USD', price: 3120.23, timestamp: Date.now() },
  },
  'dao.votes.eth': {
    name: 'dao.votes.eth',
    method: 'getVotes',
    description: 'DAO voting data and quorum information',
    category: 'dao',
    trustScore: 4,
    cost: 'Free',
    ttl: 60,
    lastUpdated: new Date().toISOString(),
    signer: '0x1234567890123456789012345678901234567890',
    gatewayURL: process.env.GATEWAY_URL || 'http://localhost:3000',
    sampleResult: { totalVotes: 1250, yesVotes: 850, quorumMet: true },
  },
  'nftfloor.eth': {
    name: 'nftfloor.eth',
    method: 'getFloorPrice',
    description: 'NFT collection floor prices from major marketplaces',
    category: 'nft',
    trustScore: 4,
    cost: '0.001 ETH',
    ttl: 300,
    lastUpdated: new Date().toISOString(),
    signer: '0x1234567890123456789012345678901234567890',
    gatewayURL: process.env.GATEWAY_URL || 'http://localhost:3000',
    sampleResult: { floorPrice: 2.5, currency: 'ETH', volume24h: 45.2 },
  },
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name)
    
    // In production, fetch from:
    // 1. On-chain resolver
    // 2. Database/Indexer
    // 3. Gateway registry
    
    const endpoint = mockEndpoints[name]
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(endpoint)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

