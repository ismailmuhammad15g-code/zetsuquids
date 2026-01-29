/**
 * Paymob Payment Status Handler
 * Handles payment completion callbacks from Paymob iframe
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') {
        res.statusCode = 200
        res.end()
        return
    }

    if (req.method !== 'GET') {
        res.statusCode = 405
        return res.json({ error: 'Method not allowed' })
    }

    try {
        // Get query parameters from Paymob redirect
        const url = new URL(req.url, `http://${req.headers.host}`)
        const success = url.searchParams.get('success')
        const orderId = url.searchParams.get('order')
        const pending = url.searchParams.get('pending')

        console.log('[Payment Status] Received:', { success, orderId, pending })

        // Determine payment status
        let status = 'declined'
        if (success === 'true') {
            status = 'success'
        } else if (pending === 'true') {
            status = 'pending'
        }

        // Return HTML page that sends message to parent window
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #000;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .status {
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⏳</div>
        <div class="message">Processing payment status...</div>
        <div class="status">Please wait</div>
    </div>
    <script>
        // Send payment status to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'PAYMENT_STATUS',
                status: '${status}',
                orderId: '${orderId || ''}'
            }, '*');
            
            // Close window after sending message
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            document.querySelector('.message').textContent = 'Payment ${status}!';
            document.querySelector('.status').textContent = 'You can close this window now.';
            document.querySelector('.icon').textContent = '${status === 'success' ? '✅' : status === 'pending' ? '⏳' : '❌'}';
        }
    </script>
</body>
</html>
        `

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(html)

    } catch (error) {
        console.error('[Payment Status] Error:', error)
        res.statusCode = 500
        return res.json({
            success: false,
            error: error.message || 'Failed to process payment status'
        })
    }
}
