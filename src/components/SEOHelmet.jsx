import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * SEOHelmet - Dynamic SEO meta tags component
 * Usage: <SEOHelmet title="Page Title" description="Page description" image="/path/to/image.jpg" />
 */
export default function SEOHelmet({ 
  title, 
  description, 
  image,
  author,
  type = 'website',
  keywords = '',
  noindex = false
}) {
  const location = useLocation()
  const baseUrl = 'https://zetsuquids.vercel.app'
  const currentUrl = `${baseUrl}${location.pathname}`

  const defaultTitle = 'ZetsuGuide - Create, Share & Discover Developer Guides'
  const defaultDescription = 'Create and share comprehensive programming guides with AI assistance. Join our community of developers and explore tutorials, code examples, and best practices.'
  const defaultImage = `${baseUrl}/social/og-image.jpg`

  const finalTitle = title ? `${title} | ZetsuGuide` : defaultTitle
  const finalDescription = description || defaultDescription
  const finalImage = image ? `${baseUrl}${image}` : defaultImage

  useEffect(() => {
    // Update document title
    document.title = finalTitle

    // Update or create meta tags
    const updateMetaTag = (property, content) => {
      if (!content) return

      // Try to find existing meta tag
      let metaTag = document.querySelector(`meta[property="${property}"]`) ||
                    document.querySelector(`meta[name="${property}"]`)

      if (metaTag) {
        metaTag.setAttribute('content', content)
      } else {
        // Create new meta tag if doesn't exist
        metaTag = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          metaTag.setAttribute('property', property)
        } else {
          metaTag.setAttribute('name', property)
        }
        metaTag.setAttribute('content', content)
        document.head.appendChild(metaTag)
      }
    }

    // Update basic meta tags
    updateMetaTag('description', finalDescription)
    updateMetaTag('keywords', keywords)
    if (author) updateMetaTag('author', author)
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Update Open Graph tags
    updateMetaTag('og:title', finalTitle)
    updateMetaTag('og:description', finalDescription)
    updateMetaTag('og:image', finalImage)
    updateMetaTag('og:url', currentUrl)
    updateMetaTag('og:type', type)

    // Update Twitter tags
    updateMetaTag('twitter:title', finalTitle)
    updateMetaTag('twitter:description', finalDescription)
    updateMetaTag('twitter:image', finalImage)
    updateMetaTag('twitter:card', 'summary_large_image')

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.setAttribute('href', currentUrl)
    } else {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      canonicalLink.setAttribute('href', currentUrl)
      document.head.appendChild(canonicalLink)
    }

  }, [finalTitle, finalDescription, finalImage, currentUrl, author, type, keywords, noindex])

  return null // This component doesn't render anything
}

/**
 * Example usage in pages:
 * 
 * import SEOHelmet from '../components/SEOHelmet'
 * 
 * function GuidePage() {
 *   return (
 *     <>
 *       <SEOHelmet 
 *         title="How to Use React Hooks"
 *         description="A comprehensive guide on React Hooks with practical examples"
 *         author="John Doe"
 *         keywords="React, Hooks, JavaScript, Tutorial"
 *         type="article"
 *       />
 *       <div>Page content...</div>
 *     </>
 *   )
 * }
 */
