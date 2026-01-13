/**
 * Supabase Client Configuration
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase
