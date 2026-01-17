import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeRequest } from '@/lib/claude'
import { searchDocuments } from '@/lib/chroma'
import { parseHttpRequest, parseHttpResponse, identifyQuickWins } from '@/lib/burp-parser'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rawRequest, rawResponse, source = 'manual' } = await request.json()

    if (!rawRequest) {
      return NextResponse.json({ error: 'Request is required' }, { status: 400 })
    }

    // Parse request and response
    const parsedRequest = parseHttpRequest(rawRequest)
    const parsedResponse = rawResponse ? parseHttpResponse(rawResponse) : null

    // Get quick wins
    const quickWins = identifyQuickWins(parsedRequest)

    // Search knowledge base for relevant context
    let context = ''
    try {
      const searchQuery = `${parsedRequest.method} ${parsedRequest.path} security vulnerabilities`
      const knowledgeResults = await searchDocuments(searchQuery, session.user.id, 3)
      if (knowledgeResults.length > 0) {
        context = knowledgeResults
          .map(r => `[${r.metadata.title}]\n${r.content}`)
          .join('\n\n---\n\n')
      }
    } catch (error) {
      console.error('Knowledge search error:', error)
    }

    // Analyze with Claude
    const analysis = await analyzeRequest(
      rawRequest,
      rawResponse || undefined,
      context
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
        request: rawRequest,
        response: rawResponse || null,
        findings: JSON.stringify(analysis),
        severity,
        source,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      id: savedAnalysis.id,
      parsedRequest,
      parsedResponse,
      quickWins,
      analysis,
      severity,
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get specific analysis
      const analysis = await prisma.analysis.findFirst({
        where: { id, userId: session.user.id },
      })

      if (!analysis) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({
        ...analysis,
        findings: JSON.parse(analysis.findings),
      })
    }

    // Get all analyses
    const analyses = await prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      analyses: analyses.map(a => ({
        ...a,
        findings: JSON.parse(a.findings),
      })),
    })
  } catch (error) {
    console.error('Analyze GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
