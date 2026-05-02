import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy image fetcher.
 * 
 * Problem: Browsers block cross-origin image fetches (CORS) for many hosts
 * like Bing, Unsplash, etc. We can't convert an external URL to base64
 * on the client side.
 * 
 * Solution: This server-side route fetches the image on behalf of the browser,
 * then streams the binary back. The client can then use FileReader to convert
 * the blob to base64 and upload it to GitHub storage.
 * 
 * Usage: GET /api/proxy-image?url=https://example.com/image.jpg
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
        return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
    }

    // Basic validation: only allow http/https URLs
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                // Some hosts require a user-agent to serve images
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                "Referer": new URL(imageUrl).origin,
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Remote server returned ${response.status}` },
                { status: 502 }
            );
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";

        // Ensure it's actually an image
        if (!contentType.startsWith("image/")) {
            return NextResponse.json(
                { error: "The URL does not point to an image" },
                { status: 400 }
            );
        }

        const buffer = await response.arrayBuffer();

        // Stream the image back to the client
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (err: any) {
        console.error("[proxy-image] Error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to fetch image" },
            { status: 502 }
        );
    }
}
