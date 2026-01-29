import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userEmail } = req.body

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the claim_daily_credits function
    const { data, error } = await supabase.rpc('claim_daily_credits', {
      p_user_email: userEmail.toLowerCase()
    })

    if (error) {
      console.error('Error calling claim_daily_credits:', error)
      return res.status(500).json({ error: 'Failed to claim daily credits' })
    }

    const result = data[0]
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        creditsAwarded: result.credits_awarded,
        newBalance: result.new_balance
      })
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        creditsAwarded: 0,
        newBalance: result.new_balance
      })
    }
  } catch (error) {
    console.error('Error claiming daily credits:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
