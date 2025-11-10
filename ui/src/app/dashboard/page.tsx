'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  BoltIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [stats, setStats] = useState({
    endpoints: 0,
    calls: 0,
    uptime: '99.9%',
    revenue: '0 ETH'
  })
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch stats
    Promise.all([
      fetch('/api/stats').then(r => r.json()).catch(() => ({})),
      fetch('http://localhost:3000/api/metrics').then(r => r.json()).catch(() => null)
    ]).then(([statsData, metricsData]) => {
      setStats({ ...stats, ...statsData })
      setMetrics(metricsData)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of ENS Compute network</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-3xl font-bold text-gray-900">
                  {metrics ? metrics.requests.total.toLocaleString() : stats.calls.toLocaleString()}
                </p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.revenue}</p>
                <p className="text-gray-600">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Request Metrics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Requests:</span>
                  <span className="font-medium">{metrics.requests.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Successful:</span>
                  <span className="font-medium text-green-600">{metrics.requests.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Errors:</span>
                  <span className="font-medium text-red-600">{metrics.requests.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">
                    {metrics.requests.total > 0
                      ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Latency:</span>
                  <span className="font-medium">
                    {metrics.latency.average ? (metrics.latency.average / 1000).toFixed(3) : 0}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hits:</span>
                  <span className="font-medium">{metrics.cache.hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Misses:</span>
                  <span className="font-medium">{metrics.cache.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hit Rate:</span>
                  <span className="font-medium">
                    {metrics.cache.hits + metrics.cache.misses > 0
                      ? ((metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses)) * 100).toFixed(2)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}

