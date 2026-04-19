import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHelmetProps {
  title?: string
  description?: string
  image?: string
  author?: string
  type?: string
  keywords?: string
  noindex?: boolean
}

export default function SEOHelmet({
  title,
  description,
  image,
  author,
  type = "website",
  keywords = "",
  noindex = false,
}: SEOHelmetProps) {
  const location = useLocation();
  const baseUrl = "https://zetsuquids.vercel.app";
  const currentUrl = `${baseUrl}${location.pathname}`;

  const defaultTitle = "ZetsuGuide - Create, Share & Discover Developer Guides";
  const defaultDescription = "Create and share comprehensive programming guides with AI assistance. Join our community of developers and explore tutorials, code examples, and best practices.";
  const defaultImage = `${baseUrl}/social/og-image.jpg`;

  const finalTitle = title ? `${title} | ZetsuGuide` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image ? `${baseUrl}${image}` : defaultImage;

  useEffect(() => {
    document.title = finalTitle;

    const updateMetaTag = (property: string, content: string): void => {
      if (!content) return;

      let metaTag = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);

      if (metaTag) {
        metaTag.setAttribute("content", content);
      } else {
        metaTag = document.createElement("meta");
        if (property.startsWith("og:") || property.startsWith("twitter:")) {
          metaTag.setAttribute("property", property);
        } else {
          metaTag.setAttribute("name", property);
        }
        metaTag.setAttribute("content", content);
        document.head.appendChild(metaTag);
      }
    };

    updateMetaTag("description", finalDescription);
    updateMetaTag("keywords", keywords);
    updateMetaTag("og:title", finalTitle);
    updateMetaTag("og:description", finalDescription);
    updateMetaTag("og:image", finalImage);
    updateMetaTag("og:type", type);
    updateMetaTag("og:url", currentUrl);
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", finalTitle);
    updateMetaTag("twitter:description", finalDescription);
    updateMetaTag("twitter:image", finalImage);

    if (author) {
      updateMetaTag("author", author);
    }

    if (noindex) {
      updateMetaTag("robots", "noindex");
    }
  }, [finalTitle, finalDescription, finalImage, keywords, author, type, noindex, currentUrl]);

  return null;
}
