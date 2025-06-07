/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/--+/g, "-") // Replace multiple - with single -
}

/**
 * Generates a canonical URL for the current page
 * @param path The path segment after the domain
 * @returns The full canonical URL
 */
export function getCanonicalUrl(path = ""): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}
