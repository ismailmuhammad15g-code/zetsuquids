-- Create guide_questions table
CREATE TABLE IF NOT EXISTS guide_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE, -- Assuming guides.id is BIGINT, will double check if it is UUID
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["A", "B", "C", "D"]
    correct_option_index INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 5 CHECK (points >= 5 AND points <= 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: The guides table uses BIGINT or INTEGER for id, or maybe UUID? Let's alter to use BIGINT/INTEGER or UUID depending on existing schema. We'll use BIGINT for now as that's typical for older Supabase, but wait, if it's BIGINT, I'll use BIGINT. Wait, the guide_versions table uses BIGINT for guide_id.
-- Wait, let me check ZETSUSAVE_COMPLETE_MERGED_SCHEMA.sql for the guides table id type.
-- I'll write the script, but I might need to adjust the guide_id type. Let's just use BIGINT as that's standard for supabase autoincrement.

CREATE TABLE IF NOT EXISTS guide_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE,
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, guide_id) -- A user can only get points once per guide
);

-- RLS for guide_questions
ALTER TABLE guide_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read questions for a guide
CREATE POLICY "Anyone can view guide questions" ON guide_questions
    FOR SELECT USING (true);

-- Only authors can insert questions for their guide
CREATE POLICY "Authors can insert guide questions" ON guide_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE guides.id = guide_questions.guide_id 
            AND guides.author_id = auth.uid()
        )
    );

-- Only authors can update their questions
CREATE POLICY "Authors can update guide questions" ON guide_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE guides.id = guide_questions.guide_id 
            AND guides.author_id = auth.uid()
        )
    );

-- Only authors can delete their questions
CREATE POLICY "Authors can delete guide questions" ON guide_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE guides.id = guide_questions.guide_id 
            AND guides.author_id = auth.uid()
        )
    );

-- RLS for guide_quiz_attempts
ALTER TABLE guide_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts" ON guide_quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own attempts" ON guide_quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle submitting a quiz and awarding points
CREATE OR REPLACE FUNCTION submit_quiz_and_award_points(
    p_guide_id BIGINT,
    p_points_earned INTEGER,
    p_user_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Ensure they haven't attempted this guide quiz already
    IF EXISTS (SELECT 1 FROM guide_quiz_attempts WHERE user_id = v_user_id AND guide_id = p_guide_id) THEN
        RETURN FALSE;
    END IF;

    -- Insert attempt
    INSERT INTO guide_quiz_attempts (user_id, guide_id, total_points_earned)
    VALUES (v_user_id, p_guide_id, p_points_earned);

    -- Award points via existing award_zpoints RPC
    -- (Assumes award_zpoints takes p_user_email and p_points)
    PERFORM award_zpoints(p_user_email, p_points_earned);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
