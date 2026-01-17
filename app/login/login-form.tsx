'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Brain, Loader2, Lock, User } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError('Kullanici adi veya sifre hatali')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setLoginError('Bir hata olustu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-10 w-10 text-orange-500" />
            <Brain className="h-5 w-5 text-orange-400 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-2xl font-bold text-white">GBrain</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Siber Guvenlik<br />
            <span className="text-orange-500">AI Asistani</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Yapay zeka destekli guvenlik analizi, zafiyet tespiti ve penetrasyon testi asistani.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">AI</div>
              <div className="text-sm text-gray-500">Claude Powered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">OWASP</div>
              <div className="text-sm text-gray-500">Top 10 Coverage</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-gray-500">Always Ready</div>
            </div>
          </div>
        </div>

        <div className="text-gray-600 text-sm">
          © 2024 GBrain. Tum haklari saklidir.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <Shield className="h-10 w-10 text-orange-500" />
              <Brain className="h-5 w-5 text-orange-400 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-2xl font-bold text-gray-800">GBrain</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Hos Geldiniz</h2>
            <p className="text-gray-500 mt-2">Devam etmek icin giris yapin</p>
          </div>

          {(error || loginError) && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {loginError || 'Giris basarisiz'}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Kullanici Adi
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Kullanici adinizi girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Sifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium text-base shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Giris Yap'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Guvenli baglanti ile korunmaktasiniz
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
