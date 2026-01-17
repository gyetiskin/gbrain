import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'
const ADMIN_ID = 'admin-user-id'

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
          // Ensure admin user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { id: ADMIN_ID }
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                id: ADMIN_ID,
                email: 'admin@gbrain.local',
                name: 'Admin',
              }
            })
          }

          return {
            id: ADMIN_ID,
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
      if (session.user) {
        session.user.id = (token.id as string) || ADMIN_ID
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sub = user.id
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
