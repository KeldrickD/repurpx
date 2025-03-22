import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import NextAuth from "next-auth/next"
import EmailProvider from "next-auth/providers/email"

const prisma = new PrismaClient()

// For debugging purposes - shows in Vercel logs
if (!process.env.EMAIL_SERVER_HOST) console.log("EMAIL_SERVER_HOST missing")
if (!process.env.EMAIL_SERVER_PORT) console.log("EMAIL_SERVER_PORT missing")
if (!process.env.EMAIL_SERVER_USER) console.log("EMAIL_SERVER_USER missing")
if (!process.env.EMAIL_SERVER_PASSWORD) console.log("EMAIL_SERVER_PASSWORD missing")
if (!process.env.EMAIL_FROM) console.log("EMAIL_FROM missing")

// Add more debugging info
console.log("Using email config:", {
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  user: process.env.EMAIL_SERVER_USER ? 'Set' : 'Not set',
  pass: process.env.EMAIL_SERVER_PASSWORD ? 'Set' : 'Not set',
  from: process.env.EMAIL_FROM
})

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: true, // Always enable debugging to diagnose the issue
  providers: [
    EmailProvider({
      // Using simpler string URL format for SMTP configuration
      server: `smtp://${process.env.EMAIL_SERVER_USER}:${encodeURIComponent(process.env.EMAIL_SERVER_PASSWORD || '')}@${process.env.EMAIL_SERVER_HOST}:${process.env.EMAIL_SERVER_PORT}`,
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // 1 day
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: async ({ session, user }: { session: any; user: any }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/signin', // Custom sign-in page (if you have one)
    error: '/auth/error', // Error page
  },
})

export { handler as GET, handler as POST } 