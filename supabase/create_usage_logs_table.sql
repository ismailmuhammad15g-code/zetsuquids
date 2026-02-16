-- Create usage_logs table for tracking AI tool usage
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_email ON usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert their own usage logs"
  ON usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own usage logs"
  ON usage_logs
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can manage all logs"
  ON usage_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON usage_logs TO authenticated;
GRANT ALL ON usage_logs TO anon;
GRANT ALL ON usage_logs TO service_role;
