import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_ASSETS_TOKEN || process.env.GITHUB_ASSETS_TOKEN || '';
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_ASSETS_REPO || 'ismailmuhammad15g-code/zetsuGuidsassets';
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_ASSETS_BRANCH || 'main';
const RAW_BASE = process.env.NEXT_PUBLIC_GITHUB_ASSETS_RAW || `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { content, path, message, folder, filename } = body;

    if (!path && !folder) {
      return NextResponse.json({ error: 'Path or folder is required' }, { status: 400 });
    }

    let filePath = path;
    let base64Content = content;

    // If folder is provided, generate a unique path
    if (folder && filename) {
      filePath = `${folder}/${filename}`;
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // If content is a data URL, extract the base64 part
    if (content && content.startsWith('data:')) {
      const match = content.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        base64Content = match[2];
      }
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    // Check if file exists to get its SHA
    let existingSha: string | undefined = undefined;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });
      if (getRes.ok) {
        const existingData = await getRes.json();
        existingSha = existingData.sha;
      }
    } catch (e) {
      // File doesn't exist yet
    }

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: message || `Upload: ${filePath}`,
        content: base64Content,
        branch: GITHUB_BRANCH,
        ...(existingSha ? { sha: existingSha } : {})
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GitHub upload failed (${response.status}): ${err?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const sha: string = data?.content?.sha || '';

    return NextResponse.json({
      url: `${RAW_BASE}/${filePath}`,
      path: filePath,
      sha,
    });

  } catch (error: any) {
    console.error('GitHub upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
