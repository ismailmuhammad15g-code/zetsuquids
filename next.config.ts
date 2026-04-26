import type { NextConfig } from "next";

// Keep config minimal and only use supported keys to avoid Next.js warnings
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ui-avatars.com",
            },
            {
                protocol: "https",
                hostname: "*.supabase.co",
            },
            {
                protocol: "https",
                hostname: "*.imgbb.com",
            },
        ],
    },
    // Allow local dev origins for HMR/websocket access
    allowedDevOrigins: ["127.0.0.1", "localhost", "100.82.121.26"],
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "100.82.121.26:3000"],
        },
    },
};

export default nextConfig;
