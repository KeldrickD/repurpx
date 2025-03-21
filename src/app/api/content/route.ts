import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  })

  if (!user?.subscription || user.subscription.status !== 'active') {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 }
    )
  }

  try {
    const { title, content, contentType } = await req.json()

    // Create initial content record
    const contentRecord = await prisma.content.create({
      data: {
        title,
        originalContent: content,
        contentType,
        status: 'processing',
        userId: user.id,
      },
    })

    // Transform content for different platforms
    const platforms = {
      twitter: 'a concise tweet thread (max 5 tweets)',
      linkedin: 'a professional LinkedIn post',
      instagram: 'an engaging Instagram caption',
    }

    const transformedContent: Record<string, string> = {}

    for (const [platform, format] of Object.entries(platforms)) {
      const prompt = `Transform the following ${contentType} content into ${format}, maintaining the key message and adapting the tone for the platform:\n\n${content}`
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      })

      transformedContent[platform] = completion.choices[0].message.content || ''
    }

    // Update content record with transformed content
    const updatedContent = await prisma.content.update({
      where: { id: contentRecord.id },
      data: {
        transformedContent,
        status: 'completed',
      },
    })

    return NextResponse.json(updatedContent)
  } catch (error) {
    console.error('Error processing content:', error)
    return NextResponse.json(
      { error: 'Error processing content' },
      { status: 500 }
    )
  }
} 