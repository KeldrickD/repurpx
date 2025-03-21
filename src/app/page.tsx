import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate">
        {/* Background gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <a href="/pricing" className="inline-flex space-x-6">
                <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
                  What&apos;s new
                </span>
                <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600">
                  <span>Just shipped v1.0</span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </span>
              </a>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Transform Your Content with AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              RepurpX helps you automatically transform your content for every social platform. Turn blogs, podcasts, and videos into engaging social posts with our AI-powered platform.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Get started
              </Link>
              <Link href="/pricing" className="text-sm font-semibold leading-6 text-gray-900">
                View pricing <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="relative w-[40rem] h-[35rem] sm:w-[57rem]">
                {/* Content preview */}
                <div className="absolute top-0 left-0 w-[24.5rem] h-[25rem] rounded-xl bg-white shadow-xl ring-1 ring-gray-400/10 sm:w-[35rem] sm:h-[30rem]">
                  <div className="border-b border-gray-200 bg-white px-6 py-4 rounded-t-xl">
                    <div className="flex items-center space-x-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                      <div className="ml-4 text-sm text-gray-500">Original Content</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                {/* Transformed content previews */}
                <div className="absolute top-10 right-0 w-[24.5rem] h-[25rem] rounded-xl bg-white shadow-xl ring-1 ring-gray-400/10 sm:w-[35rem] sm:h-[30rem]">
                  <div className="grid grid-cols-2 gap-4 p-6">
                    <div className="col-span-2">
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h3 className="text-sm font-medium text-gray-900">Twitter Thread</h3>
                        <div className="mt-2 animate-pulse space-y-3">
                          <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                          <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900">LinkedIn</h3>
                      <div className="mt-2 animate-pulse space-y-3">
                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900">Instagram</h3>
                      <div className="mt-2 animate-pulse space-y-3">
                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Create faster</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to scale your content
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Save hours of work by automatically transforming your content into multiple formats for every platform.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {[
              {
                title: 'AI-Powered Transformation',
                description: 'Our advanced AI understands your content and creates platform-specific variations that maintain your voice and message.',
              },
              {
                title: 'Multi-Platform Support',
                description: 'Automatically format your content for Twitter, LinkedIn, Instagram, TikTok, and more - all with a single click.',
              },
              {
                title: 'Analytics & Insights',
                description: 'Track performance across platforms and get AI-powered recommendations to improve your content strategy.',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  {feature.title}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
