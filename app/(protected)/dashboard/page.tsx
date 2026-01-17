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
  TrendingUp,
  Activity,
  Zap,
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
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-green-100 text-green-700'
    }
  }

  const statCards = [
    {
      label: 'Bilgi Tabani',
      value: stats.knowledgeCount,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/25',
      description: 'kayitli dokuman',
    },
    {
      label: 'Analizler',
      value: stats.analysisCount,
      icon: Shield,
      color: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/25',
      description: 'tamamlanan analiz',
    },
    {
      label: 'Chat Mesajlari',
      value: stats.chatCount,
      icon: MessageSquare,
      color: 'from-violet-500 to-violet-600',
      shadowColor: 'shadow-violet-500/25',
      description: 'mesaj',
    },
    {
      label: 'Kritik Bulgular',
      value: stats.criticalFindings,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      shadowColor: 'shadow-red-500/25',
      description: 'yuksek seviye',
    },
  ]

  const quickActions = [
    { href: '/chat', icon: MessageSquare, label: 'AI Chat', desc: 'Soru sor', color: 'orange' },
    { href: '/analyze', icon: Shield, label: 'Analiz', desc: 'Request analizi', color: 'emerald' },
    { href: '/knowledge', icon: FileText, label: 'PDF Yukle', desc: 'Dokuman ekle', color: 'blue' },
    { href: '/knowledge', icon: ImageIcon, label: 'Gorsel Ekle', desc: 'Screenshot', color: 'violet' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Hos Geldin, {session?.user?.name || 'Admin'} 👋
            </h1>
            <p className="text-gray-500 mt-1">GBrain Siber Guvenlik Asistani</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Activity className="h-4 w-4" />
            Sistem Aktif
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {loading ? '-' : stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadowColor}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-800">Hizli Erisim</h2>
            </div>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                    <action.icon className="h-5 w-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-800">Son Analizler</h2>
              </div>
              <Link
                href="/analyze"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Tumu →
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                Yukleniyor...
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Henuz analiz yapilmadi</p>
                <Link
                  href="/analyze"
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Ilk Analizi Baslat
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/analyze?id=${analysis.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate font-medium">
                        {analysis.findings.summary ||
                          analysis.findings.vulnerabilities?.[0]?.name ||
                          'Analiz tamamlandi'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analysis.source} • {new Date(analysis.createdAt).toLocaleDateString('tr')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Burp Integration */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Burp Suite Entegrasyonu</h3>
              <p className="text-gray-400 text-sm mb-4">
                Burp Suite ile otomatik zafiyet analizi yapin
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Webhook URL</p>
                  <code className="text-orange-400 text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/burp-webhook
                  </code>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">User ID</p>
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
