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
      const res = await fetch('/api/chat')
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
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
    <div className="flex flex-col h-screen">
      <div className="border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="h-8 w-8 text-emerald-500" />
            <Brain className="h-4 w-4 text-emerald-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Chat</h1>
            <p className="text-sm text-slate-400">
              Siber guvenlik sorularinizi sorun
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'border-slate-600',
              includeKnowledge
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50'
                : 'text-slate-400'
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
            className="border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-300 mb-2">
                GBrain AI Asistani
              </h2>
              <p className="text-slate-400 mb-6">
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
                    className="text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-emerald-500/50 transition-colors text-sm"
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
                    <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                )}
                <Card
                  className={cn(
                    'max-w-[80%] p-4',
                    message.role === 'user'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-200'
                  )}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {message.content}
                    </pre>
                  </div>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-700 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajinizi yazin..."
            className="min-h-[60px] max-h-[200px] bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 h-auto"
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
