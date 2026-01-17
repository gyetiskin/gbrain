'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Shield,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react'

interface Stats {
  knowledgeCount: number
  analysisCount: number
  chatCount: number
  criticalFindings: number
}

interface RecentAnalysis {
  id: string
  severity: string
  source: string
  createdAt: string
  findings: {
    summary: string
    vulnerabilities: { name: string; severity: string }[]
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    knowledgeCount: 0,
    analysisCount: 0,
    chatCount: 0,
    criticalFindings: 0,
  })
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [analysisRes, knowledgeRes, chatRes] = await Promise.all([
          fetch('/api/analyze'),
          fetch('/api/knowledge'),
          fetch('/api/chat'),
        ])

        const analysisData = await analysisRes.json()
        const knowledgeData = await knowledgeRes.json()
        const chatData = await chatRes.json()

        const analyses = analysisData.analyses || []
        const criticalCount = analyses.filter(
          (a: RecentAnalysis) => a.severity === 'critical' || a.severity === 'high'
        ).length

        setStats({
          knowledgeCount: knowledgeData.knowledge?.length || 0,
          analysisCount: analyses.length,
          chatCount: chatData.messages?.length || 0,
          criticalFindings: criticalCount,
        })

        setRecentAnalyses(analyses.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hosgeldin, {session?.user?.name || 'Kullanici'}
        </h1>
        <p className="text-slate-400">GBrain Siber Guvenlik Asistani</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Bilgi Tabani
            </CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '-' : stats.knowledgeCount}
            </div>
            <p className="text-xs text-slate-400">kayitli dokuman</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Analizler
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '-' : stats.analysisCount}
            </div>
            <p className="text-xs text-slate-400">tamamlanan analiz</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Chat Mesajlari
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '-' : stats.chatCount}
            </div>
            <p className="text-xs text-slate-400">mesaj</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Kritik Bulgular
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {loading ? '-' : stats.criticalFindings}
            </div>
            <p className="text-xs text-slate-400">yuksek/kritik seviye</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Hizli Erisim</CardTitle>
            <CardDescription className="text-slate-400">
              Sik kullanilan ozellikler
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link
              href="/chat"
              className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group"
            >
              <MessageSquare className="h-8 w-8 text-emerald-500" />
              <div className="flex-1">
                <p className="font-medium text-white">AI Chat</p>
                <p className="text-xs text-slate-400">Soru sor</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/analyze"
              className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group"
            >
              <Shield className="h-8 w-8 text-emerald-500" />
              <div className="flex-1">
                <p className="font-medium text-white">Analiz</p>
                <p className="text-xs text-slate-400">Request analizi</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group"
            >
              <FileText className="h-8 w-8 text-emerald-500" />
              <div className="flex-1">
                <p className="font-medium text-white">PDF Yukle</p>
                <p className="text-xs text-slate-400">Dokuman ekle</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group"
            >
              <ImageIcon className="h-8 w-8 text-emerald-500" />
              <div className="flex-1">
                <p className="font-medium text-white">Gorsel Ekle</p>
                <p className="text-xs text-slate-400">Screenshot analizi</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Son Analizler</CardTitle>
                <CardDescription className="text-slate-400">
                  En son yapilan guvenlik analizleri
                </CardDescription>
              </div>
              <Link
                href="/analyze"
                className="text-sm text-emerald-500 hover:text-emerald-400"
              >
                Tumu
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Yukleniyor...</p>
            ) : recentAnalyses.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Henuz analiz yapilmadi
              </p>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30"
                  >
                    <Badge
                      variant="outline"
                      className={getSeverityColor(analysis.severity)}
                    >
                      {analysis.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {analysis.findings.summary ||
                          analysis.findings.vulnerabilities?.[0]?.name ||
                          'Analiz tamamlandi'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {analysis.source} -{' '}
                        {new Date(analysis.createdAt).toLocaleDateString('tr')}
                      </p>
                    </div>
                    <Link
                      href={`/analyze?id=${analysis.id}`}
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-emerald-500" />
            Burp Suite Entegrasyonu
          </CardTitle>
          <CardDescription className="text-slate-400">
            Burp Suite ile otomatik analiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-300">
              Webhook URL: <code className="text-emerald-400">{typeof window !== 'undefined' ? window.location.origin : ''}/api/burp-webhook</code>
            </p>
            <p className="text-sm text-slate-300">
              User ID: <code className="text-emerald-400">{session?.user?.id || '-'}</code>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Burp Extension&apos;i kurun ve bu bilgileri extension ayarlarinda girin.
              Istekler otomatik olarak analiz edilecek.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
