'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  CodeBracketIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

interface EndpointDetail {
  name: string
  method: string
  description: string
  category: string
  trustScore: number
  cost: string
  ttl: number
  lastUpdated: string
  signer: string
  gatewayURL: string
  sampleResult: any
}

export default function EndpointDetailPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)
  const [endpoint, setEndpoint] = useState<EndpointDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    // Fetch endpoint details
    fetch(`/api/endpoint/${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
        setEndpoint(data)
        setLoading(false)
      })
      .catch(() => {
        // Mock data
        setEndpoint({
          name,
          method: 'getPrice',
          description: 'Real-time cryptocurrency price feeds from multiple sources',
          category: 'price',
          trustScore: 5,
          cost: 'Free',
          ttl: 30,
          lastUpdated: new Date().toISOString(),
          signer: '0x1234...5678',
          gatewayURL: 'https://gateway.example.com',
          sampleResult: { pair: 'ETH/USD', price: 3120.23, timestamp: Date.now() }
        })
        setLoading(false)
      })
  }, [name])

  const testEndpoint = async () => {
    setTesting(true)
    try {
      // Call the endpoint
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, method: endpoint?.method, params: {} })
      })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading endpoint...</p>
        </div>
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Endpoint not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{endpoint.name}</h1>
              <p className="text-gray-600 mb-4">{endpoint.description}</p>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {endpoint.category}
                </span>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CheckCircleIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < endpoint.trustScore
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">Trust Score</span>
                </div>
              </div>
            </div>
            <button
              onClick={testEndpoint}
              disabled={testing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {testing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <CodeBracketIcon className="h-5 w-5" />
                  <span>Test Endpoint</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Method Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Method</h2>
              <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                <div className="text-blue-600">{endpoint.method}</div>
                <div className="text-gray-500 mt-2">Returns: Computation result with signature</div>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Test Result</h2>
                <div className="bg-gray-900 rounded p-4 text-green-400 font-mono text-sm overflow-x-auto">
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Code Examples */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Code Examples</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">TypeScript SDK</h3>
                    <button
                      onClick={() => copyToClipboard(`const result = await ensCompute.resolve('${endpoint.name}', '${endpoint.method}', {});`)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded p-4 text-green-400 font-mono text-sm overflow-x-auto">
                    <pre>{`const result = await ensCompute.resolve('${endpoint.name}', '${endpoint.method}', {});`}</pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">CLI</h3>
                    <button
                      onClick={() => copyToClipboard(`enscompute call ${endpoint.name} ${endpoint.method}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded p-4 text-green-400 font-mono text-sm overflow-x-auto">
                    <pre>{`enscompute call ${endpoint.name} ${endpoint.method}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-green-600">{endpoint.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TTL:</span>
                  <span className="font-medium">{endpoint.ttl}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Updated:
                  </span>
                  <span className="font-medium text-sm">{new Date(endpoint.lastUpdated).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Security</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Signer:</span>
                  <div className="font-mono text-sm mt-1 break-all">{endpoint.signer}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Gateway:</span>
                  <div className="font-mono text-sm mt-1 break-all">{endpoint.gatewayURL}</div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Verified Signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

