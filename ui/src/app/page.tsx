'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const [stats, setStats] = useState({
    endpoints: 0,
    calls: 0,
    uptime: '99.9%'
  })

  useEffect(() => {
    // Fetch stats from API
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BoltIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ENS Compute</h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/explorer" className="text-gray-700 hover:text-blue-600 transition">
                Explorer
              </Link>
              <Link href="/author" className="text-gray-700 hover:text-blue-600 transition">
                Author Console
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
            Resolution as Computation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform ENS names into verifiable computation endpoints.
            <br />
            <code className="text-lg">pricefeed.eth</code> → <code className="text-lg">{"{ \"ETH/USD\": 3120.23, signature: ... }"}</code>
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/explorer"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Explore Endpoints
            </Link>
            <Link
              href="/author"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Create Endpoint
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.endpoints}</p>
                <p className="text-gray-600">Active Endpoints</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BoltIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.calls.toLocaleString()}</p>
                <p className="text-gray-600">Total Calls</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.uptime}</p>
                <p className="text-gray-600">Uptime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">Verifiable Computation</h3>
            <p className="text-gray-600">
              Off-chain compute with on-chain signature verification. Every result is cryptographically signed.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">Cursor Pagination</h3>
            <p className="text-gray-600">
              Handle large result sets efficiently with cursor-based pagination and digest chaining.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">L2 Caching</h3>
            <p className="text-gray-600">
              Cache signed results on L2 for cheaper access and shared state across the network.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

