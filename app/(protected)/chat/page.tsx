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
  Shield,
  Database,
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
  const [knowledgeCount, setKnowledgeCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMessages()
    fetchKnowledgeCount()
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

  const fetchKnowledgeCount = async () => {
    try {
      const res = await fetch('/api/knowledge')
      const data = await res.json()
      if (data.knowledge) {
        setKnowledgeCount(data.knowledge.length)
      }
    } catch (error) {
      console.error('Error fetching knowledge count:', error)
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
        body: JSON.stringify({ message: userMessage, includeKnowledge: true }),
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-orange-500">AI Asistan</h1>
              <p className="text-sm text-zinc-500">Siber guvenlik uzmani</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
              <Database className="h-4 w-4" />
              <span className="font-medium">{knowledgeCount} dokuman</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="h-9 px-3 bg-transparent border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
              <p className="text-zinc-500">Sohbet gecmisi yukleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-orange-500 mb-2">GBrain AI Asistani</h2>
              <p className="text-zinc-400 text-center max-w-md mb-6">
                Siber guvenlik, zafiyet analizi ve web guvenligi konularinda size yardimci olmak icin buradayim.
              </p>
              {knowledgeCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                  <Database className="h-4 w-4" />
                  {knowledgeCount} dokuman bilgi tabanindan okunuyor
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  message.role === 'user'
                    ? 'bg-zinc-700'
                    : 'bg-orange-500'
                )}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm text-zinc-400">Dusunuyor...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajinizi yazin..."
              className="min-h-[48px] max-h-[200px] py-3 bg-zinc-800 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
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
    </div>
  )
}
