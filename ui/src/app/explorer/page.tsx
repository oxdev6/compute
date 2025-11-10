'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Endpoint {
  name: string
  method: string
  category: string
  trustScore: number
  cost: string
  lastUpdated: string
  ttl: number
  description?: string
}

export default function Explorer() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch endpoints from API
    fetch('/api/endpoints')
      .then(res => res.json())
      .then(data => {
        setEndpoints(data)
        setLoading(false)
      })
      .catch(() => {
        // Mock data for development
        setEndpoints([
          {
            name: 'pricefeed.eth',
            method: 'getPrice',
            category: 'price',
            trustScore: 5,
            cost: 'Free',
            lastUpdated: '2 min ago',
            ttl: 30,
            description: 'Real-time cryptocurrency price feeds'
          },
          {
            name: 'dao.votes.eth',
            method: 'getVotes',
            category: 'dao',
            trustScore: 4,
            cost: 'Free',
            lastUpdated: '5 min ago',
            ttl: 60,
            description: 'DAO voting data and quorum information'
          },
          {
            name: 'nftfloor.eth',
            method: 'getFloorPrice',
            category: 'nft',
            trustScore: 4,
            cost: '0.001 ETH',
            lastUpdated: '1 min ago',
            ttl: 300,
            description: 'NFT collection floor prices'
          }
        ])
        setLoading(false)
      })
  }, [])

  const filtered = endpoints.filter(ep => {
    const matchesSearch = ep.name.toLowerCase().includes(search.toLowerCase()) ||
                         ep.method.toLowerCase().includes(search.toLowerCase()) ||
                         (ep.description && ep.description.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || ep.category === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Endpoint Explorer</h1>
          <p className="text-gray-600">Discover and explore verifiable computation endpoints</p>
          
          {/* Search and Filter */}
          <div className="mt-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search endpoints (e.g., pricefeed.eth, getPrice)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="price">Price Feeds</option>
              <option value="dao">DAO</option>
              <option value="nft">NFT</option>
              <option value="ai">AI</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Loading endpoints...</p>
          </div>
        )}

        {/* Endpoint Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((endpoint) => (
                <Link
                  key={endpoint.name}
                  href={`/endpoint/${encodeURIComponent(endpoint.name)}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{endpoint.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{endpoint.method}()</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <CheckCircleIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < endpoint.trustScore
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {endpoint.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{endpoint.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{endpoint.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost:</span>
                      <span className="font-medium text-green-600">{endpoint.cost}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">TTL:</span>
                      <span className="font-medium">{endpoint.ttl}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Updated:
                      </span>
                      <span className="font-medium">{endpoint.lastUpdated}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No endpoints found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

