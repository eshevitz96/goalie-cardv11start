# GoalieCard Standing Rules & Architecture Standards

These standing rules apply strictly to all development, feature additions, and maintenance tasks:

## 1. Security & Data Access Rules
1. **Default Deny**: Any data not belonging to the logged-in user requires a strict server-side role check.
2. **Service Role Protection**: Never use `getSupabaseAdmin()` or the Supabase Service Role key in a server action or API route without `verifyCoachAuthorization()` first.
3. **Session Derivation**: Never trust IDs or emails sent from the client for ownership. Always derive the user identity directly from the authenticated server session (`auth.getUser()`).
4. **No Permission Inference from Missing Data**: Never compute permissions from missing data (e.g. "no goalie_name = coach").
5. **Private Storage by Default**: Never use public storage URLs for user content. All game-film and reflection attachments must use short-lived server-generated signed URLs (`createSignedUrl`).
6. **Film Privacy Rule**: A goalie's film is visible ONLY to that goalie. The coach sees it ONLY if the goalie explicitly enables "Share with coach" (`film_clips.shared_with_coach = true`).
7. **No Secrets in Source**: No hardcoded secrets, passwords, or service keys in source code. All configuration must use environment variables.
8. **Real Account Verification**: Every change touching data access must be tested with a real parent account before deployment.
9. **Constraint Integrity**: Do not modify schema, RLS, `useAuth.ts`, or `middleware.ts`. Report database-side requirements instead.

## 2. Structure & Design System Rules ("One Dresser, Separate Drawers")
10. **One App Shell & Drawer Navigation**:
    - All drawers (Calendar, Training, Film, Lessons, Billing, Coach) open and close identically.
    - Every drawer screen uses the unified sticky header (`sticky top-0 z-[1100] w-full bg-background border-b border-border h-auto md:h-20`) with:
      - Left-aligned back navigation to Dashboard (`<Link href="/dashboard"><ChevronLeft size={20} /> Dashboard</Link>`).
      - Clean breadcrumb hierarchy (`Goalie Card / [Drawer Name]`).
      - Cohesive mobile navigation via `<MobileBottomNav />`.
11. **One Design System (Inherited from `/dashboard`)**:
    - **Typography**: Clean, non-italic, sans-serif page titles (`text-2xl md:text-[2.2rem] font-bold tracking-tight text-foreground font-sans`), clean metric labels (`text-[10px] font-black uppercase tracking-widest text-muted-foreground`). No loud neon or stylized italic headlines.
    - **Cards**: `bg-card border border-border rounded-2xl shadow-sm`.
    - **Buttons**: Primary buttons use `bg-foreground text-background font-bold px-4 py-2.5 rounded-xl hover:bg-foreground/90 active:scale-95 transition-all text-xs sm:text-sm`.
    - **Empty States**: Minimal icon, muted heading, and single clear action.
12. **Billing Access Control**:
    - The Billing button and navigation link must render ONLY for accounts that possess an active Stripe customer ID or a matched private training enrollment (`private_training_submissions`). Non-paying / non-enrolled users must never see the billing button.

## 3. Content, Tone & Beta Feedback Standards
13. **Banned Terminology & Neutral Tone**:
    - The word "AI" (and "artificial intelligence", "LLM", "GPT", "Claude", "model", "bot", "assistant") never appears anywhere a user can see: UI copy, buttons, labels, empty states, emails, tooltips, page titles, metadata.
    - Conversational features read as plain conversation; they never claim to be a specific person and never show a human name as the speaker.
14. **Private Training Beta Feedback Loop**:
    - Private training clients (`private_training_submissions`) participate in a lightweight feedback loop:
      - An account menu "Feedback" item (one free-text box + optional screenshot).
      - After every 3rd logged session, one optional, dismissible, non-blocking prompt: "How's Goalie Card working for you?" (1–5 rating + optional note).
      - All feedback is stored in the `feedback` table (`id`, `user_id`, `kind` ['menu', 'prompt'], `rating`, `body`, `page`, `created_at`; owner insert, coach read).
      - Coaches can review all client feedback in Coach OS sorted newest first.
