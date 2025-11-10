import { NextResponse } from 'next/server'

// Mock endpoint registry - in production, fetch from on-chain or database
const mockEndpoints = [
  {
    name: 'pricefeed.eth',
    method: 'getPrice',
    category: 'price',
    trustScore: 5,
    cost: 'Free',
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    ttl: 30,
    description: 'Real-time cryptocurrency price feeds from multiple sources',
  },
  {
    name: 'dao.votes.eth',
    method: 'getVotes',
    category: 'dao',
    trustScore: 4,
    cost: 'Free',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ttl: 60,
    description: 'DAO voting data and quorum information',
  },
  {
    name: 'nftfloor.eth',
    method: 'getFloorPrice',
    category: 'nft',
    trustScore: 4,
    cost: '0.001 ETH',
    lastUpdated: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    ttl: 300,
    description: 'NFT collection floor prices from major marketplaces',
  },
]

export async function GET() {
  try {
    // In production, fetch from:
    // 1. On-chain ENS registry
    // 2. Database/Indexer
    // 3. Gateway registry
    
    // For now, return mock data
    return NextResponse.json(mockEndpoints)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

