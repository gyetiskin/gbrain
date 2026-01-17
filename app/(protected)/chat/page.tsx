'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Shield,
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI Asistan</h1>
              <p className="text-sm text-gray-500">Siber guvenlik uzmani</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-10 px-4 rounded-xl border-2 transition-all',
                includeKnowledge
                  ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  : 'text-gray-500 border-gray-200 hover:bg-gray-50'
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
              className="h-10 px-4 rounded-xl border-2 border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-500">Sohbet gecmisi yukleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16">
              <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/25 mb-6">
                  <Shield className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  GBrain AI Asistani
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Siber guvenlik, zafiyet analizi ve web guvenligi konularinda size yardimci olmak icin buradayim.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: '🔍', text: 'OWASP Top 10 hakkinda bilgi ver' },
                  { icon: '💉', text: 'SQL Injection nasil tespit edilir?' },
                  { icon: '🛡️', text: 'XSS turleri nelerdir?' },
                  { icon: '🔐', text: 'JWT token guvenligi nasil saglanir?' },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setInput(suggestion.text)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 text-left hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/10 transition-all group"
                  >
                    <span className="text-2xl">{suggestion.icon}</span>
                    <span className="text-gray-700 group-hover:text-gray-900">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                  message.role === 'user'
                    ? 'bg-gray-700'
                    : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25'
                )}>
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 max-w-[80%] rounded-2xl px-5 py-4',
                    message.role === 'user'
                      ? 'bg-gray-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="text-gray-500">Dusunuyor...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajinizi yazin..."
                className="min-h-[56px] max-h-[200px] pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 resize-none focus:border-orange-500 focus:ring-0 transition-colors"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            GBrain siber guvenlik konularinda yardimci olmak icin tasarlanmistir.
          </p>
        </div>
      </div>
    </div>
  )
}
