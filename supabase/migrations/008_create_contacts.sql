-- 008_fix_contacts_sequence.sql
-- Fix contacts table sequence

-- Check if table exists and fix sequence
DO $$
BEGIN
    -- Check if contact table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact') THEN
        -- Reset the sequence to the maximum contact_id + 1
        PERFORM setval('contact_contact_id_seq', COALESCE((SELECT MAX(contact_id) FROM contact), 0) + 1, false);
    ELSE
        -- Create table if it doesn't exist
        CREATE TABLE contact (
            contact_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            title VARCHAR(255),
            profile_image_url TEXT,
            phone VARCHAR(50),
            email VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable Row Level Security
        ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

        -- Create policies for authenticated users
        CREATE POLICY "Allow authenticated users to view contacts" ON contact
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to insert contacts" ON contact
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to update contacts" ON contact
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to delete contacts" ON contact
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_contact_name ON contact(name);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact(email);