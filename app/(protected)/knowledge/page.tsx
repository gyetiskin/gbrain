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
  Database,
  BarChart3,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
      toast({
        title: 'Hata',
        description: 'Baslik gerekli',
        variant: 'destructive',
      })
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
          toast({
            title: 'Hata',
            description: 'Dosya secin',
            variant: 'destructive',
          })
          setIsUploading(false)
          return
        }
        formData.append('file', file)
      } else if (activeTab === 'text') {
        if (!text.trim()) {
          toast({
            title: 'Hata',
            description: 'Metin gerekli',
            variant: 'destructive',
          })
          setIsUploading(false)
          return
        }
        formData.append('text', text)
      } else if (activeTab === 'url') {
        if (!url.trim()) {
          toast({
            title: 'Hata',
            description: 'URL gerekli',
            variant: 'destructive',
          })
          setIsUploading(false)
          return
        }
        formData.append('url', url)
      }

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: 'Basarili',
        description: 'Bilgi eklendi',
      })

      setTitle('')
      setText('')
      setUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setDialogOpen(false)
      fetchKnowledge()
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Yuklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      toast({
        title: 'Basarili',
        description: 'Silindi',
      })

      setKnowledge((prev) => prev.filter((k) => k.id !== id))
    } catch {
      toast({
        title: 'Hata',
        description: 'Silinemedi',
        variant: 'destructive',
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'url':
        return <LinkIcon className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-600 border-red-200'
      case 'image':
        return 'bg-violet-100 text-violet-600 border-violet-200'
      case 'url':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      default:
        return 'bg-emerald-100 text-emerald-600 border-emerald-200'
    }
  }

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'from-red-500 to-red-600'
      case 'image':
        return 'from-violet-500 to-violet-600'
      case 'url':
        return 'from-blue-500 to-blue-600'
      default:
        return 'from-emerald-500 to-emerald-600'
    }
  }

  // Stats calculation
  const stats = {
    total: knowledge.length,
    pdf: knowledge.filter((k) => k.type === 'pdf').length,
    image: knowledge.filter((k) => k.type === 'image').length,
    text: knowledge.filter((k) => k.type === 'text').length,
    url: knowledge.filter((k) => k.type === 'url').length,
    totalChars: knowledge.reduce((acc, k) => acc + k.content.length, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bilgi Tabani</h1>
            <p className="text-gray-500 mt-1">PDF, gorsel, metin ve URL kaynaklari</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-800">Yeni Bilgi Ekle</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Bilgi tabanina yeni kaynak ekleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700">
                    Baslik
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Ornek: OWASP Top 10 2023"
                  />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="pdf" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </TabsTrigger>
                    <TabsTrigger value="image" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Gorsel
                    </TabsTrigger>
                    <TabsTrigger value="text" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Metin
                    </TabsTrigger>
                    <TabsTrigger value="url" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf" className="space-y-2 mt-4">
                    <Label className="text-gray-700">PDF Dosyasi</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="bg-gray-50 border-gray-200 text-gray-800 file:bg-orange-500 file:text-white file:border-0 file:rounded file:mr-2"
                    />
                  </TabsContent>

                  <TabsContent value="image" className="space-y-2 mt-4">
                    <Label className="text-gray-700">Gorsel Dosyasi</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="bg-gray-50 border-gray-200 text-gray-800 file:bg-orange-500 file:text-white file:border-0 file:rounded file:mr-2"
                    />
                    <p className="text-xs text-gray-500">
                      Claude Vision ile analiz edilecek
                    </p>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-2 mt-4">
                    <Label className="text-gray-700">Metin</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="bg-gray-50 border-gray-200 text-gray-800 min-h-[150px] focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Guvenlik bilgilerini girin..."
                    />
                  </TabsContent>

                  <TabsContent value="url" className="space-y-2 mt-4">
                    <Label className="text-gray-700">URL</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-gray-50 border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="https://example.com/article"
                    />
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yukleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-500">Toplam</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.pdf}</p>
                <p className="text-xs text-gray-500">PDF</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.image}</p>
                <p className="text-xs text-gray-500">Gorsel</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.text}</p>
                <p className="text-xs text-gray-500">Metin</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.url}</p>
                <p className="text-xs text-gray-500">URL</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{(stats.totalChars / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Karakter</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Semantik Arama</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="SQL injection nasil tespit edilir?"
                className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-12 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Ara'
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-500 font-medium">
                {searchResults.length} sonuc bulundu
              </p>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-orange-200 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(result.metadata?.type || 'text')}`}>
                      {getTypeIcon(result.metadata?.type || 'text')}
                      {result.metadata?.type || 'text'}
                    </span>
                    <span className="text-gray-800 font-medium">
                      {result.metadata?.title || 'Untitled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              Tum Dokumanlar
            </h2>
            <span className="text-sm text-gray-500">{knowledge.length} kaynak</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-500">Yukleniyor...</p>
            </div>
          ) : knowledge.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Henuz kaynak eklenmemis</p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ilk kaynagi ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {knowledge.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${getTypeBgColor(item.type)} shadow-lg flex-shrink-0`}>
                          {item.type === 'pdf' && <FileText className="h-5 w-5 text-white" />}
                          {item.type === 'image' && <ImageIcon className="h-5 w-5 text-white" />}
                          {item.type === 'url' && <LinkIcon className="h-5 w-5 text-white" />}
                          {item.type === 'text' && <BookOpen className="h-5 w-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                              {item.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString('tr')}
                            </span>
                          </div>
                          <h3 className="text-gray-800 font-semibold truncate">{item.title}</h3>
                          <p className="text-sm text-gray-500 truncate">{item.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="h-9 px-3 border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {expandedId === item.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-9 px-3 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview */}
                    {expandedId !== item.id && (
                      <div className="mt-3 pl-16">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.content.slice(0, 300)}...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {expandedId === item.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Icerik Ozeti</span>
                        <span className="text-xs text-gray-400">({item.content.length.toLocaleString()} karakter)</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                          {item.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
