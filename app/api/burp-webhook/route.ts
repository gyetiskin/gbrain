import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeRequest } from '@/lib/claude'
import { BurpWebhookPayload } from '@/lib/burp-parser'

// Burp webhook endpoint - accepts requests from Burp Suite extension
// This endpoint uses API key authentication instead of session auth

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-API-Key')
    const userId = request.headers.get('X-User-Id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'API key and User ID required' },
        { status: 401 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const payload: BurpWebhookPayload = await request.json()

    if (!payload.request) {
      return NextResponse.json({ error: 'Request is required' }, { status: 400 })
    }

    // Analyze the request
    const analysis = await analyzeRequest(
      payload.request,
      payload.response || undefined
    )

    // Determine severity
    let severity = 'low'
    if (analysis.vulnerabilities.some(v => v.severity === 'critical')) {
      severity = 'critical'
    } else if (analysis.vulnerabilities.some(v => v.severity === 'high')) {
      severity = 'high'
    } else if (analysis.vulnerabilities.some(v => v.severity === 'medium')) {
      severity = 'medium'
    }

    // Save analysis
    const savedAnalysis = await prisma.analysis.create({
      data: {
        request: payload.request,
        response: payload.response || null,
        findings: JSON.stringify(analysis),
        severity,
        source: 'burp',
        userId,
      },
    })

    return NextResponse.json({
      id: savedAnalysis.id,
      analysis,
      severity,
      url: payload.url,
      method: payload.method,
    })
  } catch (error) {
    console.error('Burp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Health check endpoint for Burp extension
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'GBrain Burp Webhook',
    version: '1.0.0',
  })
}
