import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtylnjjgltbmviehqxal.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWxuampnbHRibXZpZWhxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTU4MTUsImV4cCI6MjA5MTU5MTgxNX0.PjwTqQqbDdBhfdakBSZfhutQXoSm6fSdPsiBufSRcfA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const supabasePayload = {
        title: "Test Guide 123",
        slug: "test-guide-123",
        cover_image: null,
        content: "Test Content",
        keywords: ["test"],
        content_type: "markdown",
        category: "Development",
        difficulty: "Beginner",
        estimated_time: "5 mins",
        user_email: "ai@zetsuguide.com",
        author_name: "",
        author_id: null,
        views_count: 0,
        status: "pending"
    };

    const { data, error } = await supabase
        .from("guides")
        .insert([supabasePayload])
        .select()
        .single();
    
    console.log("Data:", data);
    console.log("Error:", error);
}

testInsert();
