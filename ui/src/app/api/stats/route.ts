import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch from gateway metrics endpoint
    const gatewayURL = process.env.GATEWAY_URL || 'http://localhost:3000'
    
    let stats = {
      endpoints: 3,
      calls: 0,
      uptime: '99.9%',
      revenue: '0 ETH',
    }

    try {
      const metricsResponse = await fetch(`${gatewayURL}/api/metrics`, {
        next: { revalidate: 10 } // Cache for 10 seconds
      })
      
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json()
        stats.calls = metrics.requests?.total || 0
        stats.uptime = metrics.uptime 
          ? `${(100 - (metrics.uptime / 86400) * 0.1).toFixed(1)}%`
          : '99.9%'
      }
    } catch (error) {
      // Gateway not available, use defaults
      console.warn('Gateway metrics unavailable:', error)
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

