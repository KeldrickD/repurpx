import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import NextAuth from "next-auth/next"
import EmailProvider from "next-auth/providers/email"
import { createTransport } from "nodemailer"

const prisma = new PrismaClient()

// For debugging purposes - shows in Vercel logs
console.log("NextAuth initializing with these environment variables set:", {
  NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  EMAIL_SERVER_HOST: !!process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: !!process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: !!process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: !!process.env.EMAIL_SERVER_PASSWORD,
  EMAIL_FROM: !!process.env.EMAIL_FROM,
  DATABASE_URL: !!process.env.DATABASE_URL
})

// Create transporter outside the provider to test it directly
let transporter = null;
try {
  transporter = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_PORT === "465",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });
  
  // Verify connection configuration
  transporter.verify(function (error) {
    if (error) {
      console.log("SMTP Server connection error:", error);
    } else {
      console.log("SMTP Server connection verified successfully");
    }
  });
} catch (error) {
  console.error("Failed to create email transporter:", error);
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: true, // Always enable debugging to diagnose the issue
  providers: [
    EmailProvider({
      // Use the pre-tested transporter if available
      server: transporter || {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || "587"),
        secure: process.env.EMAIL_SERVER_PORT === "465",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
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