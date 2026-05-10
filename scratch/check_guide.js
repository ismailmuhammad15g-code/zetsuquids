const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuide() {
    const { data, error } = await supabase.from('guides').select('id, title, status').eq('id', 282).maybeSingle();
    console.log('Guide 282:', data);
    if (error) console.error('Error:', error);
}

checkGuide();
