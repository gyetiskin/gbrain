'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  Search,
  Loader2,
  Upload,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Knowledge {
  id: string
  title: string
  content: string
  type: string
  source: string
  createdAt: string
}

interface SearchResult {
  id: string
  content: string
  metadata: {
    userId: string
    title: string
    type: string
    source?: string
    createdAt: string
  }
}

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pdf')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchKnowledge()
  }, [])

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge')
      const data = await res.json()
      if (data.knowledge) {
        setKnowledge(data.knowledge)
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/knowledge?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.results) {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!title.trim()) {
      toast({ title: 'Hata', description: 'Baslik gerekli', variant: 'destructive' })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('type', activeTab)

      if (activeTab === 'pdf' || activeTab === 'image') {
        const file = fileInputRef.current?.files?.[0]
        if (!file) {
          toast({ title: 'Hata', description: 'Dosya secin', variant: 'destructive' })
          setIsUploading(false)
          return
        }
        formData.append('file', file)
      } else if (activeTab === 'text') {
        if (!text.trim()) {
          toast({ title: 'Hata', description: 'Metin gerekli', variant: 'destructive' })
          setIsUploading(false)
          return
        }
        formData.append('text', text)
      } else if (activeTab === 'url') {
        if (!url.trim()) {
          toast({ title: 'Hata', description: 'URL gerekli', variant: 'destructive' })
          setIsUploading(false)
          return
        }
        formData.append('url', url)
      }

      const res = await fetch('/api/knowledge', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      toast({ title: 'Basarili', description: 'Bilgi eklendi' })
      setTitle('')
      setText('')
      setUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setDialogOpen(false)
      fetchKnowledge()
    } catch (error) {
      toast({ title: 'Hata', description: error instanceof Error ? error.message : 'Yuklenemedi', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Basarili', description: 'Silindi' })
      setKnowledge((prev) => prev.filter((k) => k.id !== id))
    } catch {
      toast({ title: 'Hata', description: 'Silinemedi', variant: 'destructive' })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText
      case 'image': return ImageIcon
      case 'url': return LinkIcon
      default: return BookOpen
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-500/20 text-red-400'
      case 'image': return 'bg-purple-500/20 text-purple-400'
      case 'url': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-emerald-500/20 text-emerald-400'
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">Bilgi Tabani</h1>
            <p className="text-zinc-400 mt-1">PDF, gorsel, metin ve URL kaynaklari</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-orange-500">Yeni Bilgi Ekle</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Bilgi tabanina yeni kaynak ekleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Baslik</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white focus:border-orange-500"
                    placeholder="Ornek: OWASP Top 10 2023"
                  />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-zinc-800 border-zinc-700">
                    <TabsTrigger value="pdf" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
                      <FileText className="h-4 w-4 mr-1" /> PDF
                    </TabsTrigger>
                    <TabsTrigger value="image" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
                      <ImageIcon className="h-4 w-4 mr-1" /> Gorsel
                    </TabsTrigger>
                    <TabsTrigger value="text" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
                      <BookOpen className="h-4 w-4 mr-1" /> Metin
                    </TabsTrigger>
                    <TabsTrigger value="url" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
                      <LinkIcon className="h-4 w-4 mr-1" /> URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf" className="space-y-2 mt-4">
                    <Label className="text-white">PDF Dosyasi</Label>
                    <Input ref={fileInputRef} type="file" accept=".pdf" className="bg-zinc-800 border-zinc-700 text-white" />
                  </TabsContent>

                  <TabsContent value="image" className="space-y-2 mt-4">
                    <Label className="text-white">Gorsel Dosyasi</Label>
                    <Input ref={fileInputRef} type="file" accept="image/*" className="bg-zinc-800 border-zinc-700 text-white" />
                    <p className="text-xs text-zinc-500">Claude Vision ile analiz edilecek</p>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-2 mt-4">
                    <Label className="text-white">Metin</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                      placeholder="Guvenlik bilgilerini girin..."
                    />
                  </TabsContent>

                  <TabsContent value="url" className="space-y-2 mt-4">
                    <Label className="text-white">URL</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="https://example.com/article"
                    />
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isUploading}>
                  {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Yukleniyor...</> : <><Upload className="h-4 w-4 mr-2" />Kaydet</>}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-lg font-semibold text-orange-500 mb-4">Semantik Arama</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="SQL injection nasil tespit edilir?"
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ara'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-zinc-400">{searchResults.length} sonuc bulundu</p>
              {searchResults.map((result) => {
                const TypeIcon = getTypeIcon(result.metadata?.type || 'text')
                return (
                  <div key={result.id} className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getTypeColor(result.metadata?.type || 'text'))}>
                        <TypeIcon className="h-3 w-3 inline mr-1" />
                        {result.metadata?.type || 'text'}
                      </span>
                      <span className="text-sm font-medium text-white">{result.metadata?.title || 'Untitled'}</span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2">{result.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-orange-500">Tum Dokumanlar</h2>
            <span className="text-sm text-zinc-500">{knowledge.length} kaynak</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
              <p className="text-zinc-500">Yukleniyor...</p>
            </div>
          ) : knowledge.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
              <BookOpen className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 mb-4">Henuz kaynak eklenmemis</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Ilk kaynagi ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledge.map((item) => {
                const TypeIcon = getTypeIcon(item.type)
                const isExpanded = expandedId === item.id
                return (
                  <div key={item.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', getTypeColor(item.type))}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getTypeColor(item.type))}>{item.type}</span>
                            <span className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString('tr')}</span>
                          </div>
                          <h3 className="font-medium text-white">{item.title}</h3>
                          <p className="text-sm text-zinc-500 truncate">{item.source}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : item.id)} className="h-8 px-2 text-zinc-400 hover:text-white">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 px-2 text-zinc-500 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {!isExpanded && (
                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2 pl-11">{item.content.slice(0, 200)}...</p>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="border-t border-zinc-800 bg-zinc-800/50 p-4">
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 max-h-80 overflow-y-auto">
                          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{item.content}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
