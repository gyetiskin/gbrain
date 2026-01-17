import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Kullanici adi ve sifre gerekli')
        }

        // Check hardcoded credentials
        if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@gbrain.local',
          }
        }

        throw new Error('Gecersiz kullanici adi veya sifre')
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'gbrain-secret-key',
}
