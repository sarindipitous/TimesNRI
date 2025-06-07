/**
 * Utility function to ensure image URLs are properly formatted for production
 * @param url The image URL or path
 * @returns A properly formatted URL for use in production
 */
export function getImageUrl(url: string): string {
  // If it's already a blob URL or absolute URL, return it as is
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return url
  }

  // If it's a placeholder, return it as is
  if (url.startsWith("/placeholder.svg")) {
    return url
  }

  // For local images, you could add a fallback to a placeholder
  // This helps prevent broken images in production
  return "/placeholder.svg?height=400&width=600"
}

/**
 * Maps of image paths to their blob URLs
 * Add new images here as they're uploaded
 */
export const imageMap: Record<string, string> = {
  // Example format:
  // '/images/local-path.png': 'https://blob-url.com/image.png',

  // Current images
  "/images/local-care-team.png":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/local-care-team-Ap00kL8ItOVIMG8cR0cD8fvyjn0HHL.png",
  "/images/real-time-updates.jpg":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/real-time-updates-sB3cCZBvmDgQ6Miwpmd6ZOahgsE8A2.png",

  // Testimonial images
  "/images/testimonial-priya.jpg":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/testimonial-priya-3JivuRkEAVYZg6dIauB5U8TkUFqZjc.png",
  "/images/testimonial-rajiv.jpg":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/testimonial-rajiv-gQkydyfHaurTpi4qIYm0nnH6nPmdwm.png",
  "/images/testimonial-anand.jpg":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/testimonial-anand-4OkUX6DGpCZf9zwwOuKWSb9SOSSvOT.png",

  // Founder image
  "/images/founder-gaurav.jpg":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/founder-headshot-gbaUhTRVnCGEx13k6KoFFKqzvenOuU.jpeg",

  // Service locations map
  "/images/service-locations-map.png":
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/service-locations-map-63p1Tm4pyG6tE3Iuk5DLd4tvWxUo4l.png",

  // Add new images here as they're uploaded
}

/**
 * Gets the blob URL for a local image path
 * @param localPath The local image path
 * @returns The blob URL if available, or the original path
 */
export function getBlobUrl(localPath: string): string {
  return imageMap[localPath] || localPath
}
