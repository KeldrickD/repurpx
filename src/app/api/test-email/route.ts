import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  // Only allow in development or with explicit env flag
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_EMAIL_TEST !== 'true') {
    return NextResponse.json({ error: 'This route is disabled in production' }, { status: 403 })
  }

  try {
    // Get email config
    const host = process.env.EMAIL_SERVER_HOST
    const port = process.env.EMAIL_SERVER_PORT
    const user = process.env.EMAIL_SERVER_USER
    const pass = process.env.EMAIL_SERVER_PASSWORD
    const from = process.env.EMAIL_FROM

    // Check if all required fields are present
    if (!host || !port || !user || !pass || !from) {
      return NextResponse.json({
        error: 'Missing email configuration',
        missing: {
          host: !host,
          port: !port,
          user: !user,
          pass: !pass,
          from: !from
        }
      }, { status: 500 })
    }

    // Log configuration (without exposing full password)
    console.log('Email test config:', {
      host,
      port,
      user,
      pass: pass ? `${pass.substring(0, 3)}...` : null,
      from
    })

    // Create transport
    const transport = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: port === '465',
      auth: {
        user,
        pass
      }
    })

    // Test connection
    await transport.verify()
    console.log('SMTP connection verified successfully')

    // Send test email
    const result = await transport.sendMail({
      from,
      to: user, // Send to self for testing
      subject: 'RepurpX Email Test',
      text: 'This is a test email to verify SMTP configuration for RepurpX.',
      html: '<p>This is a test email to verify SMTP configuration for <strong>RepurpX</strong>.</p>'
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      envelope: result.envelope
    })
  } catch (error: any) {
    console.error('Email test error:', error)
    
    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      code: error.code,
      command: error.command,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, { status: 500 })
  }
} 