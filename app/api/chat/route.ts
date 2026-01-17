import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { chat, Message } from '@/lib/claude'
import { searchDocuments } from '@/lib/chroma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, includeKnowledge = true } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        role: 'user',
        content: message,
        userId: session.user.id,
      },
    })

    // Get recent chat history
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const messages: Message[] = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Search knowledge base for context
    let context = ''
    if (includeKnowledge) {
      try {
        const knowledgeResults = await searchDocuments(message, session.user.id, 3)
        if (knowledgeResults.length > 0) {
          context = knowledgeResults
            .map(r => `[${r.metadata.title}]\n${r.content}`)
            .join('\n\n---\n\n')
        }
      } catch (error) {
        console.error('Knowledge search error:', error)
        // Continue without knowledge context
      }
    }

    // Get AI response
    const response = await chat(messages, context)

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        role: 'assistant',
        content: response,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
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
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear chat history
    await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
