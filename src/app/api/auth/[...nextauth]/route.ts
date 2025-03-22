import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth/next"
import EmailProvider from "next-auth/providers/email"
import { createTransport } from "nodemailer"
import { prisma } from "@/lib/prisma" // Use the shared Prisma instance
import { NextResponse } from "next/server"

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

// Test database connection
try {
  // Simple query to test the database connection
  prisma.$queryRaw`SELECT 1+1 AS result`.then(() => {
    console.log('Database connection verified successfully');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).catch((err: any) => {
    console.error('Database connection error:', err);
  });
} catch (error) {
  console.error('Error testing database connection:', error);
}

// Create the NextAuth handler with error handling
const authHandler = NextAuth({
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
    signIn: '/signin', // Custom sign-in page
    error: '/auth/error', // Error page
  },
})

// Wrap the handler in a try-catch to properly handle errors
export async function GET(req: Request) {
  try {
    return await authHandler(req);
  } catch (error) {
    console.error('NextAuth GET handler error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An error occurred during authentication'
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    return await authHandler(req);
  } catch (error) {
    console.error('NextAuth POST handler error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An error occurred during authentication'
      }),
      { status: 500 }
    );
  }
} 