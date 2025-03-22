import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth/next"
import EmailProvider from "next-auth/providers/email"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Debug log all environment variables
const envVars = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
  DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + "..." : "Not set",
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_FROM: process.env.EMAIL_FROM,
};

console.log("NextAuth environment variables:", envVars);

// Basic configuration with minimal moving parts
const authOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database" as const,
  },
  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
};

// Test database connection
async function testDbConnection() {
  try {
    console.log("Testing database connection...");
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log("Database connection successful:", result);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Handler
const handler = async (req: Request) => {
  // Test database before initializing NextAuth
  const dbConnectionOk = await testDbConnection();
  if (!dbConnectionOk) {
    console.error("NextAuth initialization skipped due to database connection failure");
    return new NextResponse(
      JSON.stringify({
        error: "Database Error",
        message: "Could not connect to the database",
      }),
      { status: 500 }
    );
  }

  try {
    console.log(`NextAuth handler for ${req.method} request to ${req.url}`);
    const authHandler = NextAuth(authOptions);
    return await authHandler(req);
  } catch (error) {
    console.error("NextAuth handler error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Authentication Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};

export { handler as GET, handler as POST } 