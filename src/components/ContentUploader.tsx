import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContentUploaderProps {
  subscription: {
    plan: string
    status: string
  } | null
}

export function ContentUploader({ subscription }: ContentUploaderProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('blog')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          contentType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create content')
      }

      setTitle('')
      setContent('')
      router.refresh()
    } catch (error) {
      console.error('Error creating content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Active subscription required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You need an active subscription to upload content.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="title"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="content-type" className="block text-sm font-medium text-gray-700">
          Content Type
        </label>
        <select
          id="content-type"
          name="content-type"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="blog">Blog Post</option>
          <option value="video">Video Script</option>
          <option value="podcast">Podcast Script</option>
        </select>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <div className="mt-1">
          <textarea
            rows={4}
            name="content"
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Transform Content'}
        </button>
      </div>
    </form>
  )
} 