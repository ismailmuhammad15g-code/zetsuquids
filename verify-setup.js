#!/usr/bin/env node
/**
 * Quick Vercel Setup Verification
 * Run this to verify your local setup is correct
 */

import fs from 'fs';

console.log('🔍 Verifying Zetsu Guide Setup...\n');

// Check .env file
const envPath = '.env';
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'VITE_AI_API_URL',
    'VITE_AI_API_KEY',
    'VITE_AI_MODEL'
];

console.log('📋 Checking Required Environment Variables:');
let missingVars = [];

requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=`, 'm');
    if (regex.test(envContent)) {
        console.log(`  ✅ ${varName}`);
    } else {
        console.log(`  ❌ ${varName} - MISSING`);
        missingVars.push(varName);
    }
});

// Check API file
console.log('\n📁 Checking API Files:');
const apiFile = 'api/ai.js';
if (fs.existsSync(apiFile)) {
    console.log(`  ✅ ${apiFile} exists`);
    const apiContent = fs.readFileSync(apiFile, 'utf-8');
    if (apiContent.includes('timeout: 30000')) {
        console.log(`  ✅ Error handling implemented`);
    } else {
        console.log(`  ⚠️  Error handling may need update`);
    }
} else {
    console.log(`  ❌ ${apiFile} not found`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (missingVars.length === 0) {
    console.log('✅ LOCAL SETUP IS CORRECT!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Click your project');
    console.log('3. Settings → Environment Variables');
    console.log('4. Add all 6 variables from your .env file');
    console.log('5. Push to GitHub (triggers redeploy)');
    console.log('6. Wait 1-2 minutes for deployment');
    console.log('7. Test the AI feature on your site');
} else {
    console.log(`❌ SETUP INCOMPLETE: ${missingVars.length} variable(s) missing`);
    console.log('\nMissing:');
    missingVars.forEach(v => console.log(`  - ${v}`));
    console.log('\nFix: Update your .env file with all required variables');
}
console.log('='.repeat(50));
