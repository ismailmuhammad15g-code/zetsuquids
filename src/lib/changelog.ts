import { uploadTextToGitHub, RAW_BASE } from './github-assets';

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  tag: 'feature' | 'improvement' | 'fix' | 'announcement';
  version?: string;
}

export interface ChangelogData {
  entries: ChangelogEntry[];
  updated_at: string;
}

const CHANGELOG_PATH = 'changelog/data.json';

export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  try {
    const url = `${RAW_BASE}/${CHANGELOG_PATH}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: ChangelogData = await res.json();
    return data.entries || [];
  } catch {
    return [];
  }
}

export async function saveChangelog(entries: ChangelogEntry[]): Promise<boolean> {
  try {
    const data: ChangelogData = {
      entries,
      updated_at: new Date().toISOString(),
    };
    await uploadTextToGitHub(
      JSON.stringify(data, null, 2),
      CHANGELOG_PATH,
      'Update changelog'
    );
    return true;
  } catch (e) {
    console.error('Failed to save changelog:', e);
    return false;
  }
}
