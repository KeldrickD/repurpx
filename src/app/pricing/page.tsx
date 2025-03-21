import Link from 'next/link'

const tiers = [
  {
    name: 'Basic',
    id: 'basic',
    href: '/signup?plan=basic',
    price: { monthly: '$49' },
    description: 'Perfect for content creators just getting started.',
    features: [
      'Transform up to 10 pieces of content per month',
      'Support for blogs and social media',
      'Basic AI transformations',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    id: 'pro',
    href: '/signup?plan=pro',
    price: { monthly: '$99' },
    description: 'For growing creators and small businesses.',
    features: [
      'Transform up to 50 pieces of content per month',
      'Support for blogs, videos, and podcasts',
      'Advanced AI transformations',
      'Priority email support',
      'Analytics dashboard',
      'Custom branding',
    ],
  },
  {
    name: 'Agency',
    id: 'agency',
    href: '/signup?plan=agency',
    price: { monthly: '$299' },
    description: 'For agencies and large content teams.',
    features: [
      'Unlimited content transformations',
      'All content types supported',
      'Advanced AI with custom training',
      '24/7 priority support',
      'Advanced analytics and reporting',
      'White-label solution',
      'API access',
      'Multiple team members',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h1>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for&nbsp;you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Start transforming your content today. Cancel anytime.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                tierIdx === 1 ? 'lg:z-10 lg:rounded-b-none' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h2 className="text-lg font-semibold leading-8 text-gray-900">{tier.name}</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price.monthly}</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <svg
                        className="h-6 w-5 flex-none text-indigo-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={tier.href}
                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  tierIdx === 1
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 