'use client'

import { useState } from 'react'
import { 
  CodeBracketIcon, 
  PlayIcon,
  DocumentArrowUpIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

export default function AuthorConsole() {
  const [name, setName] = useState('')
  const [method, setMethod] = useState('')
  const [code, setCode] = useState(`// Your compute function
async function compute(params = {}) {
  // Fetch data, process, etc.
  const result = {
    success: true,
    data: { /* your result */ },
    type: 'custom'
  };
  return result;
}

module.exports = { compute };`)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testCode = async () => {
    setTesting(true)
    try {
      // In production, this would execute in a sandbox
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTestResult({ success: true, message: 'Code executed successfully (sandbox mode)' })
    } catch (error: any) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setTesting(false)
    }
  }

  const deploy = async () => {
    alert('Deployment would connect to your wallet and deploy the resolver. This is a demo.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Author Console</h1>
          <p className="text-gray-600">Create and deploy verifiable computation endpoints</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENS Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="myendpoint.eth"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="compute"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Compute Function</h2>
                <button
                  onClick={testCode}
                  disabled={testing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>{testing ? 'Testing...' : 'Test'}</span>
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                spellCheck={false}
              />
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`bg-white rounded-lg shadow p-6 ${testResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                <h2 className="text-xl font-semibold mb-4">Test Result</h2>
                <div className={`rounded p-4 font-mono text-sm ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {testResult.success ? (
                    <div>{testResult.message}</div>
                  ) : (
                    <div>Error: {testResult.error}</div>
                  )}
                </div>
              </div>
            )}

            {/* Deploy */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Deploy</h2>
              <p className="text-gray-600 mb-4">
                Deploy your compute endpoint to the ENS Compute network. This will:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Deploy resolver contract (if needed)</li>
                <li>Configure gateway URL and signer</li>
                <li>Register your compute function</li>
                <li>Set up monitoring and billing</li>
              </ul>
              <button
                onClick={deploy}
                disabled={!name || !method}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <DocumentArrowUpIcon className="h-5 w-5" />
                <span>Deploy Endpoint</span>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documentation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Documentation</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Function Signature</h3>
                  <p>Your function must export a <code className="bg-gray-100 px-1 rounded">compute</code> function that takes <code className="bg-gray-100 px-1 rounded">params</code> and returns a result object.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Return Format</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
{`{
  success: true,
  data: { /* your data */ },
  type: 'custom'
}`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Determinism</h3>
                  <p>Functions must be deterministic. Avoid random values, local timestamps (use signed timestamps instead), and non-deterministic APIs.</p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <KeyIcon className="h-5 w-5" />
                <span>Security</span>
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Signing keys are managed securely</p>
                <p>• All results are cryptographically signed</p>
                <p>• Gateway runs in isolated environment</p>
                <p>• Audit logs for all computations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

