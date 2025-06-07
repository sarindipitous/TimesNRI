export function Footer() {
  return (
    <footer className="bg-primary text-white py-8">
      <div className="container px-4 md:px-6">
        <div className="text-center text-sm text-gray-300">
          <p>© {new Date().getFullYear()} Times NRI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
