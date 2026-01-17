'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Search,
  Shield,
  Brain,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Genel bakis' },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare, description: 'Soru & cevap' },
  { href: '/knowledge', label: 'Bilgi Tabani', icon: BookOpen, description: 'Dokumanlar' },
  { href: '/analyze', label: 'Analiz', icon: Search, description: 'HTTP analizi' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex flex-col h-full w-72 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative p-2 bg-orange-500/10 rounded-xl">
            <Shield className="h-7 w-7 text-orange-500" />
            <Brain className="h-4 w-4 text-orange-400 absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">GBrain</span>
            <p className="text-xs text-gray-500">Security AI</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                isActive ? 'bg-orange-600' : 'bg-gray-800 group-hover:bg-gray-700'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{item.label}</span>
                <p className={cn(
                  'text-xs',
                  isActive ? 'text-orange-100' : 'text-gray-500'
                )}>{item.description}</p>
              </div>
              <ChevronRight className={cn(
                'h-4 w-4 transition-transform',
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              )} />
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
              {session?.user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || 'admin@gbrain.local'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cikis Yap</span>
          </button>
        </div>
      </div>
    </div>
  )
}
