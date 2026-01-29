/**
 * Paymob Payment Creation API
 * Creates a payment order and returns iframe URL for client
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

    if (req.method !== 'POST') {
        res.statusCode = 405
        return res.json({ error: 'Method not allowed' })
    }

    try {
        const { userEmail, amount, credits } = req.body

        console.log('[Payment API] Request received:', { userEmail, amount, credits })

        if (!userEmail || !amount || !credits) {
            res.statusCode = 400
            return res.json({ error: 'Missing required fields' })
        }

        const API_KEY = process.env.VITE_PAYMOB_API_KEY
        const INTEGRATION_ID = process.env.VITE_PAYMOB_INTEGRATION_ID
        const IFRAME_ID = process.env.VITE_PAYMOB_IFRAME_ID

        console.log('[Payment API] Environment check:', {
            hasApiKey: !!API_KEY,
            hasIntegrationId: !!INTEGRATION_ID,
            hasIframeId: !!IFRAME_ID
        })

        if (!API_KEY || !INTEGRATION_ID || !IFRAME_ID) {
            console.error('[Payment API] Missing environment variables')
            res.statusCode = 500
            return res.json({ error: 'Server configuration error - missing credentials' })
        }

        // Step 1: Authentication - Get auth token
        console.log('[Payment API] Step 1: Authenticating with Paymob...')
        const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: API_KEY })
        })

        if (!authResponse.ok) {
            const errorText = await authResponse.text()
            console.error('[Payment API] Auth failed:', authResponse.status, errorText)
            throw new Error(`Paymob authentication failed: ${authResponse.status}`)
        }

        const authData = await authResponse.json()
        const authToken = authData.token
        console.log('[Payment API] Authentication successful, token received')

        // Step 2: Create Order
        console.log('[Payment API] Step 2: Creating order...')
        const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authToken,
                delivery_needed: 'false',
                amount_cents: amount * 100,
                currency: 'EGP',
                items: [{
                    name: `${credits} ZetsuGuide Credits`,
                    amount_cents: amount * 100,
                    description: `Purchase of ${credits} AI credits`,
                    quantity: 1
                }]
            })
        })

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text()
            console.error('[Payment API] Order creation failed:', orderResponse.status, errorText)
            throw new Error(`Failed to create order: ${orderResponse.status}`)
        }

        const orderData = await orderResponse.json()
        const orderId = orderData.id
        console.log('[Payment API] Order created successfully:', orderId)

        // Step 3: Create Payment Key
        console.log('[Payment API] Step 3: Creating payment key...')
        const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authToken,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: orderId,
                billing_data: {
                    email: userEmail,
                    first_name: userEmail.split('@')[0],
                    last_name: 'User',
                    phone_number: '+20000000000',
                    apartment: 'NA',
                    floor: 'NA',
                    street: 'NA',
                    building: 'NA',
                    shipping_method: 'NA',
                    postal_code: 'NA',
                    city: 'Cairo',
                    country: 'EG',
                    state: 'NA'
                },
                currency: 'EGP',
                integration_id: parseInt(INTEGRATION_ID),
                lock_order_when_paid: 'true'
            })
        })

        if (!paymentKeyResponse.ok) {
            const errorText = await paymentKeyResponse.text()
            console.error('[Payment API] Payment key creation failed:', paymentKeyResponse.status, errorText)
            throw new Error(`Failed to create payment key: ${paymentKeyResponse.status}`)
        }

        const paymentKeyData = await paymentKeyResponse.json()
        const paymentToken = paymentKeyData.token
        console.log('[Payment API] Payment key created successfully')

        // Return iframe URL
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`

        console.log('[Payment API] Success! Returning iframe URL')
        res.statusCode = 200
        return res.json({
            success: true,
            iframeUrl,
            orderId,
            paymentToken
        })

    } catch (error) {
        console.error('[Payment API] Error:', error.message)
        console.error('[Payment API] Stack:', error.stack)
        res.statusCode = 500
        return res.json({
            success: false,
            error: error.message || 'Failed to create payment'
        })
    }
}
