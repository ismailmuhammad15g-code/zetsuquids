import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ui-avatars.com",
            },
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
        ],
    },
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "localhost:5173"]
        }
    }
};

export default nextConfig;
