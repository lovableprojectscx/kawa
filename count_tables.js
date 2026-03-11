const tables = [
    'vault_vision', 'vault_operator_projects', 'vault_operator_calendar_events',
    'vault_operator_tasks', 'chat_sessions', 'chat_messages', 'vault_founder_energy',
    'vault_context_people', 'vault_insights', 'profiles', 'vault_documents', 'vault_memories'
];

async function countTables() {
    for (const t of tables) {
        const res = await fetch('https://api.supabase.com/v1/projects/hzngwkraexfxkyafmjpl/database/query', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer sbp_a0c428e2324a0883b93c5d6f20294df76a8c2f9c',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: 'SELECT COUNT(*) FROM ' + t + ';' })
        });
        const data = await res.json();
        console.log(t, data);
    }
}
countTables().catch(console.error);
