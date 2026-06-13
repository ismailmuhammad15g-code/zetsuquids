import type { Metadata } from "next";
import Script from "next/script";
import Providers from "../components/Providers";
import "../index.css";

export const metadata: Metadata = {
    title: "Zetsuquids",
    description: "Your technical guides and references",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
            {/* EMERGENCY CACHE BUSTER - Wipes local storage once per user */}
            <Script id="cache-buster" strategy="beforeInteractive" suppressHydrationWarning>
                {`
                    if (typeof window !== 'undefined') {
                        const CACHE_VERSION = "v1-nuclear-reset";
                        if (localStorage.getItem("zetsu_cache_version") !== CACHE_VERSION) {
                            console.warn("NUCLEAR RESET: Clearing all local caches");
                            localStorage.clear();
                            sessionStorage.clear();
                            localStorage.setItem("zetsu_cache_version", CACHE_VERSION);
                        }
                    }
                `}
            </Script>
        </head>
            <body className="bg-white text-black dark:bg-[#111111] dark:text-gray-100 transition-colors duration-200" suppressHydrationWarning>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
