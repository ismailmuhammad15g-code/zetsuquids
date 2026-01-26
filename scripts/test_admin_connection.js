
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env manually
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('No .env file found at:', envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envVars[match[1].trim()] = value;
    }
});

const url = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_KEY;

console.log('Checking Configuration...');
console.log('URL Present:', !!url);
console.log('Key Present:', !!key);
if (key) console.log('Key Length:', key.length);

if (!url || !key) {
    console.error('Missing URL or Key');
    process.exit(1);
}

// 2. Init Supabase
console.log('Initializing Supabase Admin...');
try {
    const supabase = createClient(url, key);

    // 3. Test Connection (List users - requires service role)
    supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
        .then(({ data, error }) => {
            if (error) {
                console.error('Supabase Admin Error:', error.message);
                console.error('Full Error:', error);
            } else {
                console.log('Success! Connected to Supabase Admin.');
                console.log('Found users:', data.users.length);
            }
        })
        .catch(err => {
            console.error('Exception calling Supabase:', err);
        });

} catch (e) {
    console.error('Exception creating client:', e);
}
