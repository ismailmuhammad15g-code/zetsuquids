// Test Routeway API connection
// Run with: node test-api.js

async function testAPI() {
    const apiKey = process.env.VITE_AI_API_KEY || 'sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA'
    const apiUrl = 'https://api.routeway.ai/v1/chat/completions'

    console.log('Testing Routeway API...')
    console.log('API URL:', apiUrl)
    console.log('API Key:', apiKey.substring(0, 20) + '...')

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'kimi-k2-0905:free',
                messages: [{ role: 'user', content: 'Say hi' }],
                max_tokens: 10,
                temperature: 0.7
            })
        })

        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        console.log('Content-Type:', response.headers.get('content-type'))

        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            console.log('✅ Success! Response:', JSON.stringify(data, null, 2))
        } else {
            const text = await response.text()
            console.log('❌ Non-JSON response:', text.substring(0, 500))
        }
    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

testAPI()
