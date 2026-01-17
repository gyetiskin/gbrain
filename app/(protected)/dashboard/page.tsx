'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Shield,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Activity,
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
        return 'bg-red-500/20 text-red-400'
      case 'high':
        return 'bg-orange-500/20 text-orange-400'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-green-500/20 text-green-400'
    }
  }

  const statCards = [
    { label: 'Bilgi Tabani', value: stats.knowledgeCount, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Analizler', value: stats.analysisCount, icon: Shield, color: 'bg-emerald-500' },
    { label: 'Chat Mesajlari', value: stats.chatCount, icon: MessageSquare, color: 'bg-purple-500' },
    { label: 'Kritik Bulgular', value: stats.criticalFindings, icon: AlertTriangle, color: 'bg-red-500' },
  ]

  const quickActions = [
    { href: '/chat', icon: MessageSquare, label: 'AI Chat', desc: 'Soru sor' },
    { href: '/analyze', icon: Shield, label: 'Analiz', desc: 'HTTP analizi' },
    { href: '/knowledge', icon: FileText, label: 'PDF Yukle', desc: 'Dokuman ekle' },
    { href: '/knowledge', icon: ImageIcon, label: 'Gorsel Ekle', desc: 'Screenshot' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">
              Hos Geldin, {session?.user?.name || 'Admin'}
            </h1>
            <p className="text-zinc-400 mt-1">GBrain Siber Guvenlik Asistani</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
            <Activity className="h-4 w-4" />
            Sistem Aktif
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loading ? '-' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <h2 className="text-lg font-semibold text-orange-500 mb-4">Hizli Erisim</h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-orange-500/20 transition-colors">
                    <action.icon className="h-4 w-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-zinc-500">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-orange-500">Son Analizler</h2>
              <Link
                href="/analyze"
                className="text-sm text-orange-500 hover:text-orange-400 font-medium"
              >
                Tumu
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-zinc-500">
                Yukleniyor...
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-zinc-500">Henuz analiz yapilmadi</p>
                <Link
                  href="/analyze"
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Ilk Analizi Baslat
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/analyze?id=${analysis.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {analysis.findings.summary ||
                          analysis.findings.vulnerabilities?.[0]?.name ||
                          'Analiz tamamlandi'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {analysis.source} • {new Date(analysis.createdAt).toLocaleDateString('tr')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Burp Integration */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-500 mb-1">Burp Suite Entegrasyonu</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Burp Suite ile otomatik zafiyet analizi yapin
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Webhook URL</p>
                  <code className="text-orange-400 text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/burp-webhook
                  </code>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">User ID</p>
                  <code className="text-orange-400 text-sm">
                    {session?.user?.id || '-'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
