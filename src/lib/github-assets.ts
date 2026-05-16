/**
 * GitHub Assets Storage Library
 *
 * Uploads files to GitHub via a server-side API route to avoid CORS issues.
 */

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_ASSETS_REPO || 'ismailmuhammad15g-code/zetsuGuidsassets';
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_ASSETS_BRANCH || 'main';
export const RAW_BASE = process.env.NEXT_PUBLIC_GITHUB_ASSETS_RAW || `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

export interface GitHubUploadResult {
  url: string;
  path: string;
  sha: string;
}

/**
 * Uploads a file to GitHub via the server-side API route.
 */
export async function uploadToGitHub(
  dataUrl: string,
  folder = 'previews',
  filename?: string
): Promise<GitHubUploadResult> {
  const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${name}`;

  const response = await fetch('/api/github-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: dataUrl,
      path,
      message: `Upload asset: ${name}`,
      isBase64: true
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Upload failed (${response.status})`);
  }

  return response.json();
}

/**
 * Uploads plain text content to GitHub.
 */
export async function uploadTextToGitHub(
  content: string,
  path: string,
  message = `Upload: ${path}`
): Promise<GitHubUploadResult> {
  // Encode text to base64
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/plain;base64,${base64Content}`;

  const response = await fetch('/api/github-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: dataUrl,
      path,
      message,
      isBase64: true
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Upload failed (${response.status})`);
  }

  return response.json();
}

/**
 * Uploads a component's code bundle.
 */
export async function uploadComponentCode(
  componentId: string,
  payload: {
    mode: 'react' | 'classic';
    react_files?: { name: string; content: string }[];
    html_code?: string;
    css_code?: string;
    js_code?: string;
  }
): Promise<string> {
  const path = `components/${componentId}/code.json`;
  const jsonContent = JSON.stringify(payload, null, 2);
  const result = await uploadTextToGitHub(jsonContent, path, `Save component code: ${componentId}`);
  return result.url;
}

/**
 * Lists all version files for a specific guide from GitHub.
 */
export async function listHistoryFromGitHub(slug: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/github-upload?action=list&path=guides/history/${slug}`);
    if (!response.ok) return [];
    return response.json();
  } catch (e) {
    return [];
  }
}

/**
 * Checks if GitHub is configured.
 */
export function isGitHubConfigured(): boolean {
  return true; // Always configured since we use server-side API
}
