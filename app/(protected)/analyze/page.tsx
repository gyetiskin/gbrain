'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'

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
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-emerald-100 text-emerald-700'
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
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guvenlik Analizi</h1>
          <p className="text-slate-500 mt-1">HTTP request/response analizi</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="analyze" className="data-[state=active]:bg-white">
              <Search className="h-4 w-4 mr-2" />
              Analiz
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white">
              <History className="h-4 w-4 mr-2" />
              Gecmis ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">HTTP Request</h3>
                <p className="text-sm text-slate-500 mb-4">Ham HTTP istegini yapistirin</p>
                <Textarea
                  value={rawRequest}
                  onChange={(e) => setRawRequest(e.target.value)}
                  placeholder={sampleRequest}
                  className="min-h-[280px] font-mono text-sm bg-slate-50 border-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">HTTP Response (Opsiyonel)</h3>
                <p className="text-sm text-slate-500 mb-4">Sunucu cevabini da ekleyebilirsiniz</p>
                <Textarea
                  value={rawResponse}
                  onChange={(e) => setRawResponse(e.target.value)}
                  placeholder="HTTP/1.1 200 OK&#10;Content-Type: application/json&#10;&#10;{&quot;user&quot;: {...}}"
                  className="min-h-[280px] font-mono text-sm bg-slate-50 border-slate-200 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawRequest.trim()}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
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
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Analiz Sonucu</h3>
                    <span className={cn('px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1', getSeverityColor(result.severity))}>
                      {getSeverityIcon(result.severity)}
                      <span className="capitalize">{result.severity}</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Ozet</h4>
                      <p className="text-slate-600">{result.analysis.summary}</p>
                    </div>

                    {result.quickWins && result.quickWins.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Hizli Tespitler
                        </h4>
                        <ul className="space-y-1">
                          {result.quickWins.map((win, i) => (
                            <li key={i} className="text-sm text-yellow-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                              {win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Oneriler</h4>
                        <ul className="space-y-1">
                          {result.analysis.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {result.analysis.vulnerabilities.length > 0 && (
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Bulunan Zafiyetler ({result.analysis.vulnerabilities.length})
                    </h3>
                    <div className="space-y-4">
                      {result.analysis.vulnerabilities.map((vuln, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-slate-900">{vuln.name}</h4>
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getSeverityColor(vuln.severity))}>
                              {vuln.severity}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-slate-500">Aciklama: </span>
                              <span className="text-slate-700">{vuln.description}</span>
                            </div>

                            {vuln.location && (
                              <div>
                                <span className="text-slate-500">Konum: </span>
                                <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {vuln.location}
                                </code>
                              </div>
                            )}

                            {vuln.evidence && (
                              <div>
                                <span className="text-slate-500">Kanit: </span>
                                <code className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  {vuln.evidence}
                                </code>
                              </div>
                            )}

                            {vuln.owaspCategory && (
                              <div>
                                <span className="text-slate-500">OWASP: </span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {vuln.owaspCategory}
                                </span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-200">
                              <span className="text-slate-500">Cozum: </span>
                              <span className="text-emerald-600">{vuln.remediation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-1">Analiz Gecmisi</h3>
              <p className="text-sm text-slate-500 mb-4">Onceki analizleriniz</p>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Henuz analiz yapilmamis</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadAnalysis(item.id)}
                        className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1', getSeverityColor(item.severity))}>
                            {getSeverityIcon(item.severity)}
                            <span className="capitalize">{item.severity}</span>
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleString('tr')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {item.findings.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                            {item.source}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.findings.vulnerabilities?.length || 0} zafiyet
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
