import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { chat, summarizeConversation, Message } from '@/lib/claude'
import { searchDocuments } from '@/lib/chroma'

// Store conversation summaries in memory (in production, save to DB)
const conversationSummaries = new Map<string, string>()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { message, includeKnowledge = true } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        role: 'user',
        content: message,
        userId,
      },
    })

    // Get ALL chat history for full context
    const allMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    // Build messages array - use recent 50 messages directly
    const recentMessages = allMessages.slice(-50)
    const messages: Message[] = recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // If there are older messages, create/use summary
    let conversationSummary = conversationSummaries.get(userId) || ''

    if (allMessages.length > 50) {
      const olderMessages = allMessages.slice(0, -50)

      // Update summary periodically (every 20 new messages)
      if (olderMessages.length % 20 === 0 || !conversationSummary) {
        const olderMsgs: Message[] = olderMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
        conversationSummary = await summarizeConversation(olderMsgs)
        conversationSummaries.set(userId, conversationSummary)
      }
    }

    // Search knowledge base for context
    let context = ''
    if (includeKnowledge) {
      try {
        const knowledgeResults = await searchDocuments(message, userId, 5)
        if (knowledgeResults.length > 0) {
          context = knowledgeResults
            .map(r => `[${r.metadata.title}]\n${r.content}`)
            .join('\n\n---\n\n')
        }
      } catch (error) {
        console.error('Knowledge search error:', error)
      }
    }

    // Get AI response with full context
    const response = await chat(messages, context, conversationSummary)

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        role: 'assistant',
        content: response,
        userId,
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
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get all messages (or limited)
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

    // Clear conversation summary
    conversationSummaries.delete(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
