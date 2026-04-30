import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    const baseUrl = "https://zetsuquids.vercel.app";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Static pages with their priorities and change frequencies
    const staticPages = [
      { url: "", changefreq: "daily", priority: "1.0" }, // Homepage
      { url: "/guides", changefreq: "daily", priority: "0.9" },
      { url: "/community", changefreq: "daily", priority: "0.9" },
      { url: "/pricing", changefreq: "weekly", priority: "0.8" },
      { url: "/zetsuguide-ai", changefreq: "weekly", priority: "0.8" },
      { url: "/faq", changefreq: "monthly", priority: "0.7" },
      { url: "/support", changefreq: "monthly", priority: "0.7" },
      { url: "/reportbug", changefreq: "monthly", priority: "0.6" },
      { url: "/privacy", changefreq: "monthly", priority: "0.5" },
      { url: "/terms", changefreq: "monthly", priority: "0.5" },
      { url: "/auth", changefreq: "monthly", priority: "0.4" },
    ];

    // Fetch all published guides
    const { data: guides, error: guidesError } = await supabase
      .from("guides")
      .select("slug, updated_at, created_at")
      .order("created_at", { ascending: false });

    if (guidesError) {
      console.error("Error fetching guides:", guidesError);
    }

    // Fetch all user profiles for workspace pages
    const { data: profiles, error: profilesError } = await supabase
      .from("zetsuguide_user_profiles")
      .select("user_email, updated_at");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Add guide pages
    if (guides && guides.length > 0) {
      guides.forEach((guide) => {
        const lastmod =
          guide.updated_at || guide.created_at || new Date().toISOString();
        xml += "  <url>\n";
        xml += `    <loc>${baseUrl}/guide/${guide.slug}</loc>\n`;
        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += "  </url>\n";
      });
    }

    // Add workspace pages
    if (profiles && profiles.length > 0) {
      // Get unique users
      const uniqueUsers = new Map();
      profiles.forEach((profile) => {
        if (profile.user_email) {
          const username = profile.user_email.split("@")[0].toLowerCase();
          if (!uniqueUsers.has(username)) {
            uniqueUsers.set(
              username,
              profile.updated_at || new Date().toISOString(),
            );
          }
        }
      });

      uniqueUsers.forEach((lastmod, username) => {
        xml += "  <url>\n";
        xml += `    <loc>${baseUrl}/@${username}/workspace</loc>\n`;
        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += "  </url>\n";
      });
    }

    xml += "</urlset>";

    // Set headers for XML
    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=43200",
    ); // Cache for 24 hours

    return res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate sitemap", details: error.message });
  }
}
