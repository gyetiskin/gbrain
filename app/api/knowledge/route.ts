import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDocument, searchDocuments, deleteDocument } from '@/lib/chroma'
import { analyzeImage, generateEmbeddingText } from '@/lib/claude'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse')

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (query) {
      // Search in ChromaDB
      const results = await searchDocuments(query, session.user.id)
      return NextResponse.json({ results })
    }

    // Get all knowledge entries
    const knowledge = await prisma.knowledge.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ knowledge })
  } catch (error) {
    console.error('Knowledge GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const type = formData.get('type') as string
    const title = formData.get('title') as string
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null
    const url = formData.get('url') as string | null

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let content = ''
    let source = ''

    if (type === 'pdf' && file) {
      // Parse PDF
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await pdf(buffer)
      content = pdfData.text
      source = file.name
    } else if (type === 'image' && file) {
      // Analyze image with Claude Vision
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      content = await analyzeImage(base64, mediaType)
      source = file.name
    } else if (type === 'text' && text) {
      content = text
      source = 'manual entry'
    } else if (type === 'url' && url) {
      // Fetch URL content (basic implementation)
      try {
        const response = await fetch(url)
        content = await response.text()
        // Strip HTML tags for basic text extraction
        content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        source = url
      } catch {
        return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Create database entry
    const knowledge = await prisma.knowledge.create({
      data: {
        title,
        content,
        type,
        source,
        userId: session.user.id,
      },
    })

    // Generate summary for better embedding
    const embeddingText = await generateEmbeddingText(content)

    // Add to ChromaDB
    await addDocument({
      id: knowledge.id,
      content: embeddingText,
      metadata: {
        userId: session.user.id,
        title,
        type,
        source,
        createdAt: knowledge.createdAt.toISOString(),
      },
    })

    // Update chromaId
    await prisma.knowledge.update({
      where: { id: knowledge.id },
      data: { chromaId: knowledge.id },
    })

    return NextResponse.json({ knowledge })
  } catch (error) {
    console.error('Knowledge POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership
    const knowledge = await prisma.knowledge.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!knowledge) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete from ChromaDB
    if (knowledge.chromaId) {
      await deleteDocument(knowledge.chromaId)
    }

    // Delete from database
    await prisma.knowledge.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Knowledge DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
