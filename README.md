# RepurpX - AI-Powered Content Repurposing Platform

Transform your content into multiple formats for different social media platforms using AI. Save hours of work and maintain consistent messaging across all your channels.

## Features

- Transform blogs, videos, and podcasts into social media content
- AI-powered content adaptation for different platforms
- Support for Twitter, LinkedIn, and Instagram
- Real-time content transformation
- Subscription-based pricing model
- Modern, responsive UI

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- NextAuth.js
- Stripe for payments
- OpenAI API

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/KeldrickD/repurpx.git
   cd repurpx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `.env`:
   ```
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key

   # Stripe Configuration
   STRIPE_PUBLIC_KEY=your-stripe-public-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   STRIPE_BASIC_PRICE_ID=your-basic-price-id
   STRIPE_PRO_PRICE_ID=your-pro-price-id
   STRIPE_AGENCY_PRICE_ID=your-agency-price-id

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/content_transformer"

   # Email (for authentication)
   EMAIL_SERVER_HOST=your-smtp-host
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-smtp-username
   EMAIL_SERVER_PASSWORD=your-smtp-password
   EMAIL_FROM=noreply@repurpx.com
   ```

4. Initialize the database:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Prerequisites

1. A Vercel account (https://vercel.com)
2. A PostgreSQL database (we recommend using Supabase or Railway)
3. Stripe account with configured products
4. OpenAI API key
5. SMTP server for email authentication

### Deployment Steps

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Deploy to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure environment variables in Vercel's dashboard
   - Deploy

3. Configure your domain:
   - Add RepurpX.com to your Vercel project
   - Update DNS settings as per Vercel's instructions
   - Wait for DNS propagation

4. Set up Stripe webhooks:
   - Create a webhook in Stripe dashboard pointing to: https://repurpx.com/api/webhooks/stripe
   - Add the webhook secret to your environment variables

5. Configure the database:
   ```bash
   npx prisma db push
   ```

## Pricing Plans

- Basic: $49/month
  - Transform up to 10 pieces of content per month
  - Support for blogs and social media
  - Basic AI transformations
  - Email support

- Pro: $99/month
  - Transform up to 50 pieces of content per month
  - Support for blogs, videos, and podcasts
  - Advanced AI transformations
  - Priority email support
  - Analytics dashboard
  - Custom branding

- Agency: $299/month
  - Unlimited content transformations
  - All content types supported
  - Advanced AI with custom training
  - 24/7 priority support
  - Advanced analytics and reporting
  - White-label solution
  - API access
  - Multiple team members

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
