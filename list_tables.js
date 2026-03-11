const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;

fetch('https://api.supabase.com/v1/projects/hzngwkraexfxkyafmjpl/database/query', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer sbp_a0c428e2324a0883b93c5d6f20294df76a8c2f9c',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
})
    .then(r => r.json())
    .then(data => console.log('Response:', data))
    .catch(console.error);
