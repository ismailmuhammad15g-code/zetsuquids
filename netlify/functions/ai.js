// Netlify Serverless Function for AI Chat
// This proxies requests to an AI API endpoint

exports.handler = async (event, context) => {
    console.log('=== AI Function Called ===');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);

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
        console.log('Request received - Model:', model || 'default');
        console.log('Message count:', messages.length);

        // Get API configuration from environment
        const API_URL = process.env.VITE_AI_API_URL || process.env.AI_API_URL;
        const API_KEY = process.env.VITE_AI_API_KEY || process.env.AI_API_KEY;
        
        console.log('API URL configured:', !!API_URL);
        console.log('API Key configured:', !!API_KEY);

        // Validate configuration
        if (!API_URL || !API_KEY) {
            console.error('Missing AI API configuration');
            return {
                statusCode: 503,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: 'AI service not properly configured. Please check environment variables.',
                    details: {
                        hasUrl: !!API_URL,
                        hasKey: !!API_KEY
                    }
                })
            };
        }

        // Make request to AI API
        console.log('Calling AI API:', API_URL);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        console.log('AI API response status:', response.status);
        const data = await response.json();

        if (!response.ok) {
            console.error('AI API Error:', response.status, data);
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: data.error?.message || data.error || 'AI API error',
                    status: response.status
                })
            };
        }

        console.log('Successfully got response from AI API');
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('=== ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                type: error.constructor.name
            })
        };
    }
};
