
import { lookup } from 'dns';
import { promisify } from 'util';

const lookupPromise = promisify(lookup);

async function testConnection() {
  const url = 'api.routeway.ai';
  console.log(`🔍 Testing connection to ${url}...`);

  // 1. DNS Lookup
  try {
    const result = await lookupPromise(url, { all: true });
    console.log('✅ DNS Lookup successful:', result);
    const hasIpv6 = result.some(r => r.family === 6);
    if (hasIpv6) {
      console.log('⚠️ IPv6 address found. Node.js fetch might be trying to use it first.');
    }
  } catch (e) {
    console.error('❌ DNS Lookup failed:', e.message);
  }

  // 2. Fetch Test
  try {
    console.log('🌐 Attempting fetch to https://api.routeway.ai/v1/models...');
    const start = Date.now();
    const response = await fetch('https://api.routeway.ai/v1/models', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log(`✅ Fetch successful! Status: ${response.status} (${Date.now() - start}ms)`);
  } catch (e) {
    console.error('❌ Fetch failed:', e.message);
    if (e.cause) {
      console.error('   Cause:', e.cause.code || e.cause.message);
      if (e.cause.errors) {
        console.error('   Multiple Errors:', e.cause.errors.map(err => err.code || err.message));
      }
    }
  }
}

testConnection();
