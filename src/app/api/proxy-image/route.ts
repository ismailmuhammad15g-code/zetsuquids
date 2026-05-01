import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch image from external source');

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    
    return NextResponse.json({ 
      dataUrl: `data:${contentType};base64,${base64}` 
    });
  } catch (error: any) {
    console.error("Proxy Image Error:", error);
    return NextResponse.json({ 
      error: 'Failed to process image', 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
