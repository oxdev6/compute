import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, method, params } = body

    if (!name || !method) {
      return NextResponse.json(
        { error: 'Missing name or method' },
        { status: 400 }
      )
    }

    // Call gateway directly
    const gatewayURL = process.env.GATEWAY_URL || 'http://localhost:3000'
    
    try {
      const response = await fetch(`${gatewayURL}/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: method,
          params: params || {},
        }),
      })

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return NextResponse.json({
        success: true,
        result: data.result,
        signature: data.signature,
        signer: data.signer,
        envelope: data.envelope,
      })
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message || 'Failed to call gateway',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

