'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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

      // Reset form
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
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'image':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'url':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bilgi Tabani</h1>
          <p className="text-slate-400">
            PDF, gorsel, metin ve URL kaynaklari
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Bilgi Ekle</DialogTitle>
              <DialogDescription className="text-slate-400">
                Bilgi tabanina yeni kaynak ekleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Baslik
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Ornek: OWASP Top 10 2023"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-700/50 border border-slate-600">
                  <TabsTrigger value="pdf" className="data-[state=active]:bg-emerald-600">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </TabsTrigger>
                  <TabsTrigger value="image" className="data-[state=active]:bg-emerald-600">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Gorsel
                  </TabsTrigger>
                  <TabsTrigger value="text" className="data-[state=active]:bg-emerald-600">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Metin
                  </TabsTrigger>
                  <TabsTrigger value="url" className="data-[state=active]:bg-emerald-600">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pdf" className="space-y-2 mt-4">
                  <Label className="text-slate-300">PDF Dosyasi</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                  />
                </TabsContent>

                <TabsContent value="image" className="space-y-2 mt-4">
                  <Label className="text-slate-300">Gorsel Dosyasi</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                  />
                  <p className="text-xs text-slate-400">
                    Claude Vision ile analiz edilecek
                  </p>
                </TabsContent>

                <TabsContent value="text" className="space-y-2 mt-4">
                  <Label className="text-slate-300">Metin</Label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white min-h-[150px]"
                    placeholder="Guvenlik bilgilerini girin..."
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-2 mt-4">
                  <Label className="text-slate-300">URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="https://example.com/article"
                  />
                </TabsContent>
              </Tabs>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
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

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Semantik Arama</CardTitle>
          <CardDescription className="text-slate-400">
            Bilgi tabaninda arama yapin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="SQL injection nasil tespit edilir?"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-400">
                {searchResults.length} sonuc bulundu
              </p>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 rounded-lg bg-slate-700/30 border border-slate-600"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getTypeColor(result.metadata?.type || 'text')}>
                      {getTypeIcon(result.metadata?.type || 'text')}
                      <span className="ml-1">{result.metadata?.type || 'text'}</span>
                    </Badge>
                    <span className="text-white font-medium">
                      {result.metadata?.title || 'Untitled'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-3">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Tum Kaynaklar ({knowledge.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          </div>
        ) : knowledge.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Henuz kaynak eklenmemis</p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                className="mt-4 border-slate-600 text-slate-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ilk kaynagi ekle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledge.map((item) => (
              <Card
                key={item.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={getTypeColor(item.type)}>
                      {getTypeIcon(item.type)}
                      <span className="ml-1">{item.type}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-400 -mt-1 -mr-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-white text-base">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {item.content.slice(0, 200)}...
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.source}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('tr')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
