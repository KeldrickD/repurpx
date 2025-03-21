// Define a Content interface with a more flexible transformedContent type
interface Content {
  id: string
  title: string
  originalContent: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformedContent: any
  contentType: string
  status: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface ContentListProps {
  contents: Content[]
}

export function ContentList({ contents }: ContentListProps) {
  if (contents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No content yet. Start by uploading some content above.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {contents.map((content) => (
          <li key={content.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <div className="flex text-sm">
                    <p className="font-medium text-indigo-600 truncate">{content.title}</p>
                    <p className="ml-1 flex-shrink-0 text-gray-500">
                      in {content.contentType}
                    </p>
                  </div>
                  <div className="mt-2 flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <p>
                        Created on{' '}
                        {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-2 flex flex-shrink-0">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      content.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : content.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {content.status}
                  </span>
                </div>
              </div>

              {content.status === 'completed' && content.transformedContent && (
                <div className="mt-4">
                  <details className="group">
                    <summary className="list-none cursor-pointer">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          View Transformed Content
                        </span>
                        <svg
                          className="ml-2 h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-4 space-y-4">
                      {Object.entries(content.transformedContent).map(([platform, text]) => (
                        <div key={platform} className="rounded-md bg-gray-50 p-4">
                          <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">
                            {platform}
                          </h4>
                          <p className="text-sm text-gray-500 whitespace-pre-wrap">{String(text)}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
} 