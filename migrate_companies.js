const sql = `
CREATE TABLE IF NOT EXISTS vault_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    vision TEXT,
    mision TEXT,
    anti_goals JSONB DEFAULT '[]'::jsonb,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vault_companies ENABLE ROW LEVEL SECURITY;

-- Attempt to create policy (ignore if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vault_companies' AND policyname = 'Users can manage their own companies'
    ) THEN
        CREATE POLICY "Users can manage their own companies" ON vault_companies
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Add company_id to projects
ALTER TABLE vault_operator_projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES vault_companies(id) ON DELETE SET NULL;
`;

fetch('https://api.supabase.com/v1/projects/hzngwkraexfxkyafmjpl/database/query', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer sbp_a0c428e2324a0883b93c5d6f20294df76a8c2f9c',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
})
    .then(r => r.json().then(data => ({ status: r.status, data })))
    .then(res => {
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    })
    .catch(console.error);
