'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import {
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  Brain,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [includeKnowledge, setIncludeKnowledge] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      setIsLoadingHistory(true)
      const res = await fetch('/api/chat?limit=200')
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, includeKnowledge }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast({
        title: 'Hata',
        description: 'Mesaj gonderilemedi. Lutfen tekrar deneyin.',
        variant: 'destructive',
      })
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' })
      setMessages([])
      toast({
        title: 'Basarili',
        description: 'Sohbet gecmisi temizlendi.',
      })
    } catch {
      toast({
        title: 'Hata',
        description: 'Sohbet temizlenemedi.',
        variant: 'destructive',
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="h-8 w-8 text-orange-500" />
            <Brain className="h-4 w-4 text-orange-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">AI Chat</h1>
            <p className="text-sm text-gray-500">
              Siber guvenlik sorularinizi sorun
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'border-gray-300',
              includeKnowledge
                ? 'bg-orange-50 text-orange-600 border-orange-300'
                : 'text-gray-500'
            )}
            onClick={() => setIncludeKnowledge(!includeKnowledge)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Bilgi Tabani
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoadingHistory ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Sohbet gecmisi yukleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                GBrain AI Asistani
              </h2>
              <p className="text-gray-500 mb-6">
                Siber guvenlik, zafiyet analizi ve web guvenligi hakkinda soru
                sorun.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                {[
                  'OWASP Top 10 hakkinda bilgi ver',
                  'SQL Injection nasil tespit edilir?',
                  'XSS turleri nelerdir?',
                  'JWT token guvenligi nasil saglanir?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-left p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                )}
                <Card
                  className={cn(
                    'max-w-[80%] p-4',
                    message.role === 'user'
                      ? 'bg-orange-500 border-orange-400 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  )}
                >
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {message.content}
                    </pre>
                  </div>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <Card className="bg-gray-50 border-gray-200 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajinizi yazin..."
            className="min-h-[60px] max-h-[200px] bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
