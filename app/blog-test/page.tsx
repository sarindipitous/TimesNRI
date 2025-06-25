import Link from "next/link"

export default function BlogTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Blog Test Page</h1>

      <div className="space-y-4">
        <p>This page tests if blog routing is working correctly.</p>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Test Links:</h2>
          <ul className="space-y-1">
            <li>
              <Link href="/blog" className="text-blue-600 hover:underline">
                → Go to Blog Index
              </Link>
            </li>
            <li>
              <Link href="/blog/test-slug" className="text-blue-600 hover:underline">
                → Test Blog Post (will 404 if no post with slug "test-slug")
              </Link>
            </li>
            <li>
              <Link href="/api/debug-blog-complete" className="text-blue-600 hover:underline">
                → Complete Debug API
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Visit the Complete Debug API to see all blog data</li>
            <li>Check if your blog post has a proper slug</li>
            <li>Verify the slug matches what's in the URL</li>
            <li>Check browser console for any error messages</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
