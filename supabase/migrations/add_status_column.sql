-- Add status column to guides table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guides' AND column_name = 'status') THEN 
        ALTER TABLE guides ADD COLUMN status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guides' AND column_name = 'approved_by') THEN 
        ALTER TABLE guides ADD COLUMN approved_by uuid REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guides' AND column_name = 'approved_at') THEN 
        ALTER TABLE guides ADD COLUMN approved_at timestamp with time zone;
    END IF;
END $$;

-- Update existing guides to 'approved' so they remain visible
UPDATE guides SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Optional: Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS guides_status_idx ON guides(status);
