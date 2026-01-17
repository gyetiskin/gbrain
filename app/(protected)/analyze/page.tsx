'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  History,
  Zap,
  FileWarning,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Vulnerability {
  name: string
  severity: string
  description: string
  location: string
  evidence: string
  remediation: string
  owaspCategory?: string
}

interface AnalysisResult {
  id: string
  parsedRequest?: {
    method: string
    url: string
    host: string
    headers: Record<string, string>
    body: string
  }
  parsedResponse?: {
    statusCode: number
    statusText: string
    headers: Record<string, string>
    body: string
  }
  quickWins?: string[]
  analysis: {
    vulnerabilities: Vulnerability[]
    summary: string
    riskLevel: string
    recommendations: string[]
  }
  severity: string
}

interface HistoryItem {
  id: string
  severity: string
  source: string
  createdAt: string
  findings: {
    summary: string
    vulnerabilities: Vulnerability[]
    riskLevel: string
    recommendations: string[]
  }
}

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const [rawRequest, setRawRequest] = useState('')
  const [rawResponse, setRawResponse] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState('analyze')
  const { toast } = useToast()

  useEffect(() => {
    fetchHistory()

    // Check if we need to load a specific analysis
    const id = searchParams.get('id')
    if (id) {
      loadAnalysis(id)
    }
  }, [searchParams])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/analyze')
      const data = await res.json()
      if (data.analyses) {
        setHistory(data.analyses)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const loadAnalysis = async (id: string) => {
    try {
      const res = await fetch(`/api/analyze?id=${id}`)
      const data = await res.json()
      if (data) {
        setResult({
          id: data.id,
          analysis: data.findings,
          severity: data.severity,
        })
        setRawRequest(data.request || '')
        setRawResponse(data.response || '')
        setActiveTab('analyze')
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!rawRequest.trim()) {
      toast({
        title: 'Hata',
        description: 'HTTP request gerekli',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawRequest,
          rawResponse: rawResponse || undefined,
        }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult(data)
      fetchHistory()

      toast({
        title: 'Analiz Tamamlandi',
        description: `Risk seviyesi: ${data.severity}`,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Analiz basarisiz',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <FileWarning className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const sampleRequest = `GET /api/users?id=1 HTTP/1.1
Host: example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: session=abc123
Content-Type: application/json`

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Guvenlik Analizi</h1>
        <p className="text-slate-400">HTTP request/response analizi</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="analyze" className="data-[state=active]:bg-emerald-600">
            <Search className="h-4 w-4 mr-2" />
            Analiz
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600">
            <History className="h-4 w-4 mr-2" />
            Gecmis ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">HTTP Request</CardTitle>
                <CardDescription className="text-slate-400">
                  Ham HTTP istegini yapisttirin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rawRequest}
                  onChange={(e) => setRawRequest(e.target.value)}
                  placeholder={sampleRequest}
                  className="min-h-[300px] font-mono text-sm bg-slate-900 border-slate-600 text-slate-200"
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">HTTP Response (Opsiyonel)</CardTitle>
                <CardDescription className="text-slate-400">
                  Sunucu cevabini da ekleyebilirsiniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rawResponse}
                  onChange={(e) => setRawResponse(e.target.value)}
                  placeholder="HTTP/1.1 200 OK&#10;Content-Type: application/json&#10;&#10;{&quot;user&quot;: {...}}"
                  className="min-h-[300px] font-mono text-sm bg-slate-900 border-slate-600 text-slate-200"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rawRequest.trim()}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Analiz Et
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Analiz Sonucu</CardTitle>
                    <Badge variant="outline" className={getSeverityColor(result.severity)}>
                      {getSeverityIcon(result.severity)}
                      <span className="ml-1 capitalize">{result.severity}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Ozet</h4>
                    <p className="text-slate-400">{result.analysis.summary}</p>
                  </div>

                  {result.quickWins && result.quickWins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Hizli Tespitler
                      </h4>
                      <ul className="space-y-1">
                        {result.quickWins.map((win, i) => (
                          <li key={i} className="text-sm text-yellow-400/80 flex items-center gap-2">
                            <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Oneriler</h4>
                      <ul className="space-y-1">
                        {result.analysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.analysis.vulnerabilities.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Bulunan Zafiyetler ({result.analysis.vulnerabilities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.analysis.vulnerabilities.map((vuln, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-white">{vuln.name}</h4>
                            <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                              {vuln.severity}
                            </Badge>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-slate-400">Aciklama: </span>
                              <span className="text-slate-300">{vuln.description}</span>
                            </div>

                            {vuln.location && (
                              <div>
                                <span className="text-slate-400">Konum: </span>
                                <code className="text-emerald-400 bg-slate-800 px-1 rounded">
                                  {vuln.location}
                                </code>
                              </div>
                            )}

                            {vuln.evidence && (
                              <div>
                                <span className="text-slate-400">Kanit: </span>
                                <code className="text-yellow-400 bg-slate-800 px-1 rounded">
                                  {vuln.evidence}
                                </code>
                              </div>
                            )}

                            {vuln.owaspCategory && (
                              <div>
                                <span className="text-slate-400">OWASP: </span>
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                  {vuln.owaspCategory}
                                </Badge>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-700">
                              <span className="text-slate-400">Cozum: </span>
                              <span className="text-emerald-400">{vuln.remediation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Analiz Gecmisi</CardTitle>
              <CardDescription className="text-slate-400">
                Onceki analizleriniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Henuz analiz yapilmamis</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadAnalysis(item.id)}
                        className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getSeverityColor(item.severity)}>
                            {getSeverityIcon(item.severity)}
                            <span className="ml-1 capitalize">{item.severity}</span>
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleString('tr')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">
                          {item.findings.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-400 border-slate-500">
                            {item.source}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {item.findings.vulnerabilities?.length || 0} zafiyet
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
