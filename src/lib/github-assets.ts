/**
 * GitHub Assets Storage Library
 * 
 * Uploads files (images, etc.) to the zetsuGuidsassets GitHub repo
 * and returns a public raw.githubusercontent.com URL.
 * 
 * This completely replaces Supabase Storage usage for large files,
 * saving Supabase bandwidth and storage quotas.
 */

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_ASSETS_TOKEN || '';
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_ASSETS_REPO || 'ismailmuhammad15g-code/zetsuGuidsassets';
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_ASSETS_BRANCH || 'main';
export const RAW_BASE = process.env.NEXT_PUBLIC_GITHUB_ASSETS_RAW || `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

export interface GitHubUploadResult {
  url: string;       // public raw URL to use in <img src>
  path: string;      // path inside the repo
  sha: string;       // GitHub blob SHA (needed to update/delete later)
}

/**
 * Uploads a base64-encoded file (e.g. a screenshot data URL) to GitHub.
 * 
 * @param dataUrl  - A data: URL string like "data:image/webp;base64,..."
 * @param folder   - Folder inside the repo, e.g. "previews" or "avatars"
 * @param filename - Optional custom filename; auto-generated if omitted
 * @returns        - A GitHubUploadResult with the public URL
 */
export async function uploadToGitHub(
  dataUrl: string,
  folder = 'previews',
  filename?: string
): Promise<GitHubUploadResult> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_ASSETS_TOKEN is not configured.');
  }

  // Parse data URL  →  base64 content + extension
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL provided to uploadToGitHub.');
  }
  const mimeType = match[1];                // e.g. "image/webp"
  const base64Content = match[2];           // raw base64 without the prefix
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

  // Build unique path inside the repo
  const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${name}`;

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  // Check if file exists to get its SHA (required for updating files)
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
    // File likely doesn't exist yet, which is fine
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
      message: `Upload asset: ${name}`,
      content: base64Content,
      branch: GITHUB_BRANCH,
      ...(existingSha ? { sha: existingSha } : {})
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`GitHub upload failed (${response.status}): ${err?.message || response.statusText}`);
  }

  const data = await response.json();
  const sha: string = data?.content?.sha || '';

  return {
    url: `${RAW_BASE}/${path}`,
    path,
    sha,
  };
}

/**
 * Deletes a file from GitHub by its path.
 * You must provide the blob SHA (returned from uploadToGitHub).
 */
export async function deleteFromGitHub(path: string, sha: string): Promise<void> {
  if (!GITHUB_TOKEN) return;

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: `Delete asset: ${path}`,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });
}

/**
 * Checks if the GitHub token is configured and valid.
 */
export function isGitHubConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_REPO);
}

/**
 * Uploads a plain text file (JSON, code, etc.) to GitHub.
 *
 * @param content  - The raw text content to upload
 * @param path     - Full path inside repo e.g. "components/abc123/files.json"
 * @param message  - Git commit message
 */
export async function uploadTextToGitHub(
  content: string,
  path: string,
  message = `Upload: ${path}`
): Promise<GitHubUploadResult> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_ASSETS_TOKEN is not configured.');
  }

  // Encode text to base64 (works in browser and Node)
  const base64Content =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(content)))
      : Buffer.from(content, 'utf-8').toString('base64');

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  // Check if file exists to get its SHA (required for updating files)
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
    // File likely doesn't exist yet, which is fine
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
      message,
      content: base64Content,
      branch: GITHUB_BRANCH,
      ...(existingSha ? { sha: existingSha } : {})
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`GitHub upload failed (${response.status}): ${err?.message || response.statusText}`);
  }

  const data = await response.json();
  const sha: string = data?.content?.sha || '';
  const fileUrl = `${RAW_BASE}/${path}`;

  return { url: fileUrl, path, sha };
}

/**
 * Uploads a component's code bundle (react_files or html/css/js) as a JSON file to GitHub.
 * Returns the raw GitHub URL to the stored JSON.
 *
 * @param componentId - Unique ID for the component
 * @param payload     - Object containing the code files
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
  if (!GITHUB_TOKEN || !GITHUB_REPO) return [];

  const path = `guides/history/${slug}`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });

    if (!res.ok) return [];
    
    const files = await res.json();
    if (!Array.isArray(files)) return [];

    return files.map(file => ({
      name: file.name,
      path: file.path,
      sha: file.sha,
      download_url: file.download_url,
      // File name is timestamp: e.g. "1714550000000.json"
      timestamp: parseInt(file.name.replace('.json', '')) || Date.now()
    }));
  } catch (e) {
    return [];
  }
}
