import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { targetUserEmail, action } = req.body

    if (!targetUserEmail || !action) {
      return res.status(400).json({ error: 'Missing required fields: targetUserEmail and action' })
    }

    if (action !== 'follow' && action !== 'unfollow') {
      return res.status(400).json({ error: 'Invalid action. Must be "follow" or "unfollow"' })
    }

    // Get authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserEmail = user.email

    // Cannot follow yourself
    if (currentUserEmail === targetUserEmail) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    // Get target user's ID from profiles
    const { data: targetProfile, error: targetError } = await supabase
      .from('zetsuguide_user_profiles')
      .select('user_id')
      .eq('user_email', targetUserEmail)
      .single()

    if (targetError || !targetProfile || !targetProfile.user_id) {
      console.error('Target user not found:', targetError)
      return res.status(404).json({ error: 'Target user not found' })
    }

    const targetUserId = targetProfile.user_id

    if (action === 'follow') {
      // Check if already following
      const { data: existing } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (existing) {
        return res.status(400).json({ error: 'Already following this user' })
      }

      // Insert follow relationship
      const { error: followError } = await supabase
        .from('user_follows')
        .insert([{
          follower_id: user.id,
          following_id: targetUserId,
          follower_email: currentUserEmail,
          following_email: targetUserEmail
        }])

      if (followError) {
        console.error('Follow error:', followError)
        return res.status(500).json({ error: 'Failed to follow user', details: followError.message })
      }

      // Get updated follower count
      const { data: countData } = await supabase
        .rpc('get_followers_count_by_email', { target_email: targetUserEmail })

      return res.status(200).json({ 
        success: true, 
        message: 'Successfully followed user',
        isFollowing: true,
        followersCount: countData || 0
      })

    } else if (action === 'unfollow') {
      // Delete follow relationship
      const { error: unfollowError } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

      if (unfollowError) {
        console.error('Unfollow error:', unfollowError)
        return res.status(500).json({ error: 'Failed to unfollow user', details: unfollowError.message })
      }

      // Get updated follower count
      const { data: countData } = await supabase
        .rpc('get_followers_count_by_email', { target_email: targetUserEmail })

      return res.status(200).json({ 
        success: true, 
        message: 'Successfully unfollowed user',
        isFollowing: false,
        followersCount: countData || 0
      })
    }

  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
