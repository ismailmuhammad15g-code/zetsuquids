import dotenv from 'dotenv';
import https from 'https';
dotenv.config({ path: '.env.local' });

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_ASSETS_TOKEN;
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_ASSETS_REPO || 'ismailmuhammad15g-code/zetsuGuidsassets';
const BRANCH = process.env.NEXT_PUBLIC_GITHUB_ASSETS_BRANCH || 'main';

if (!GITHUB_TOKEN) {
    console.error('✅ Error: NEXT_PUBLIC_GITHUB_ASSETS_TOKEN not found in .env.local');
    process.exit(1);
}

const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'node.js'
};

async function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { ...options, headers }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve(JSON.parse(body || '{}'));
                } else {
                    console.error(`Request failed: ${res.statusCode} ${body}`);
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function nukeGitHubRepo() {
    console.log(`🔥 NUKE GITHUB ASSETS REPO: ${GITHUB_REPO} 🔥`);

    // 1. Get the current commit SHA of the branch
    const branchInfo = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/${BRANCH}`);
    if (!branchInfo) return console.error('Could not fetch branch info.');

    const commitSha = branchInfo.object.sha;

    // 2. Create a tree with a single README.md file without defining base_tree
    // GitHub API requires an array to have length > 0 if it's the only info
    // Creating this tree overwrites everything.
    const emptyTree = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({
            tree: [{
                path: 'README.md',
                mode: '100644',
                type: 'blob',
                content: '# Zetsuquids Assets\\n\\nProduction Ready - Repo reset. All other files have been securely wiped.'
            }]
        })
    });

    if (!emptyTree) return console.error('Could not create empty tree.');

    // 3. Create a new commit pointing to the new tree
    const newCommit = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({
            message: '🔥 Nuclear Wipe! Delete all files for Production Ready reset',
            tree: emptyTree.sha,
            parents: [commitSha]
        })
    });

    if (!newCommit) return console.error('Could not create new commit.');

    // 4. Update the branch reference to the new commit
    const updateRef = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${BRANCH}`, {
        method: 'PATCH',
        body: JSON.stringify({
            sha: newCommit.sha,
            force: true
        })
    });

    if (updateRef) {
        console.log('✅ Successfully wiped all files from GitHub assets repo! Everything is deleted except a single README.md.');
    }
}

nukeGitHubRepo();
