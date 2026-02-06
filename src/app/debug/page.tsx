
import { createClient } from "@supabase/supabase-js";

// Init Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export default async function DebugPage() {
    console.log("Rendering Debug Page...");

    // Fetch last 10 reflections
    const { data: reflections, error } = await supabaseAdmin
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    // Fetch Rosters
    const { data: rosters, error: rosterError } = await supabaseAdmin
        .from('roster_uploads')
        .select('*')
        .limit(10);

    return (
        <div className="p-10 text-white bg-black min-h-screen font-mono">
            <h1 className="text-xl font-bold mb-4">Debug Reflections</h1>

            {/* Roster Section */}
            <div className="mb-8 p-4 border rounded bg-gray-900">
                <h2 className="text-lg font-bold mb-2">Rosters (Check Linked User)</h2>
                {rosters?.map(r => (
                    <div key={r.id} className="text-xs mb-1 font-mono">
                        <span className="text-yellow-400">{r.id.substring(0, 8)}...</span> |
                        User: {r.linked_user_id ? <span className="text-green-400">{r.linked_user_id}</span> : <span className="text-red-500">NULL</span>} |
                        Name: {r.goalie_name}
                    </div>
                ))}
            </div>
            {error && (
                <div className="text-red-500 border p-4 mb-4">
                    Error: {error.message} (Hint: {error.hint})
                </div>
            )}
            <div className="space-y-4">
                {reflections?.map((r) => (
                    <div key={r.id} className="border p-4 rounded bg-gray-900">
                        <div><strong>ID:</strong> {r.id}</div>
                        <div><strong>Roster ID:</strong> {r.roster_id}</div>
                        <div><strong>Author ID:</strong> {r.author_id}</div>
                        <div><strong>Title:</strong> {r.title}</div>
                        <div><strong>Content:</strong> {r.content}</div>
                        <div><strong>Created:</strong> {r.created_at}</div>
                    </div>
                ))}
                {reflections?.length === 0 && <div>No entries found.</div>}
            </div>

            <div className="mt-8 border-t pt-4">
                <h2 className="text-lg font-bold">Environment Check</h2>
                <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
                <div>Key Len: {process.env.SUPABASE_SERVICE_ROLE_KEY?.length}</div>
            </div>
        </div>
    );
}
