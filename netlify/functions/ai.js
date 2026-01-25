// Netlify Serverless Function for AI Chat

exports.handler = async (event, context) => {
    console.log('Function called, method:', event.httpMethod);
    console.log('API Key exists:', !!process.env.ROUTEWAY_API_KEY);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { messages, model } = JSON.parse(event.body);
        console.log('Sending to Routeway API, model:', model || 'kimi-k2-0905:free');

        const response = await fetch('https://api.routeway.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ROUTEWAY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'kimi-k2-0905:free',
                messages: messages,
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        console.log('Routeway response status:', response.status);
        const data = await response.json();
        console.log('Response received');

        if (!response.ok) {
            console.error('API Error:', data);
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: data.error || 'AI API error' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Internal server error: ' + error.message })
        };
    }
};
