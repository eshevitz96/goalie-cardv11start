# GoalieCard Standing Security & Access Rules

These rules apply strictly to all development and maintenance tasks:

1. **Default Deny**: Any data not belonging to the logged-in user requires a server-side role check.
2. **Service Role Protection**: Never use `getSupabaseAdmin()` or the Supabase Service Role key in a server action or API route without `verifyCoachAuthorization()` first.
3. **Session Derivation**: Never trust IDs or emails sent from the client for ownership. Always derive the user identity from the server session (`auth.getUser()`).
4. **No Permission Inference from Missing Data**: Never compute permissions from missing data (e.g. "no goalie_name = coach").
5. **Private Storage by Default**: Never use public storage URLs for user content. All game-film and reflection attachments must use short-lived server-generated signed URLs (`createSignedUrl`).
6. **Film Privacy Rule**: A goalie's film is visible ONLY to that goalie. The coach sees it ONLY if the goalie explicitly enables "Share with coach" (`film_clips.shared_with_coach = true`).
7. **No Secrets in Source**: No hardcoded secrets, passwords, or service keys in source code. Use environment variables.
8. **Real Account Verification**: Every change touching data access must be tested with a real parent account before deployment, with results shown.
9. **Constraint Integrity**: Do not modify schema, RLS, `useAuth.ts`, or `middleware.ts`. Report database-side requirements instead.
