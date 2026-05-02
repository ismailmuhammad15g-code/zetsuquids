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
                {/* EMERGENCY CACHE BUSTER - Wipes local storage once per user */}
                <Script id="cache-buster" strategy="beforeInteractive">
                    {`
                        if (typeof window !== 'undefined') {
                            const CACHE_VERSION = "v1-nuclear-reset";
                            if (localStorage.getItem("zetsu_cache_version") !== CACHE_VERSION) {
                                console.warn("ðŸ”¥ NUCLEAR RESET: Clearing all local caches");
                                localStorage.clear();
                                sessionStorage.clear();
                                localStorage.setItem("zetsu_cache_version", CACHE_VERSION);
                            }
                        }
                    `}
                </Script>
                {/* OneDark (DEV.to style) syntax highlighting theme */}
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" strategy="afterInteractive" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js" strategy="afterInteractive" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js" strategy="afterInteractive" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js" strategy="afterInteractive" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/markdown.min.js" strategy="afterInteractive" />
                <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js" strategy="afterInteractive" />
            </head>
            <body className="bg-white text-black dark:bg-[#111111] dark:text-gray-100 transition-colors duration-200" suppressHydrationWarning>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
