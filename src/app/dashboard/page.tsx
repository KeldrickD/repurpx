import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { ContentUploader } from '@/components/ContentUploader'
import { ContentList } from '@/components/ContentList'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      subscription: true,
      contents: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user) {
    redirect('/signin')
  }

  const subscription = user.subscription

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            {/* Subscription Status */}
            <div className="px-4 py-5 sm:px-6">
              <div className="rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Subscription Status
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>
                      {subscription
                        ? `You are currently on the ${subscription.plan} plan`
                        : 'You do not have an active subscription'}
                    </p>
                  </div>
                  {!subscription && (
                    <div className="mt-5">
                      <a
                        href="/pricing"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        View pricing plans
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Management */}
            <div className="mt-8">
              <div className="px-4 sm:px-6">
                <h2 className="text-lg font-medium leading-6 text-gray-900">Your Content</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your content and we&apos;ll transform it for different platforms.
                </p>
              </div>

              <div className="mt-6 px-4 sm:px-6">
                <ContentUploader subscription={subscription} />
              </div>

              <div className="mt-8 px-4 sm:px-6">
                <ContentList contents={user.contents} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 