# GoalieCard v11 — Trust Model

**Version:** 1.0 (Draft)
**Date:** 2026-01-24
**Status:** REFERENCE IMPLEMENTATION

---

## 1. Core Philosophy: The "Glass Locker Room"
GoalieCard is an **Athlete-Centered** system, but it operates within a **Safety-First** triad (Athlete, Parent, Coach). The Trust Model is designed to prevent "Shadow Coaching" (hidden channels) and ensure that the digital record accurately reflects the *author's* voice, not just the account holder's permissions.

## 2. Who Can See What (Visibility)

### A. The Goalie (The Subject)
*   **Can See:**
    *   Their own reflections, stats, and journal entries.
    *   **All** feedback/notes written by the Parent or Coach attached to their profile.
    *   *Rationale:* Radical transparency. The athlete must know what is being evaluated.
*   **Cannot See:**
    *   Private billing/subscription details (unless authorized).
    *   "Raw" Coach-to-Parent private communications (if implemented in v12).

### B. The Parent (The Guardian/Sponsor)
*   **Can See:**
    *   Everything the Goalie writes (Journals, Check-ins).
    *   **Safety Trigger:** Immediate access to any "Red Flag" keywords.
    *   *Rationale:* "Human-in-the-Loop" safety protocol. We do not hide mental health signals from guardians.
*   **Cannot See:**
    *   Data for other goalies on the same team (Privacy).

### C. The Coach (The Expert)
*   **Can See:**
    *   Aggregated performance data.
    *   Goalie reflections (to tailor coaching).
*   **Cannot See:**
    *   Parents' payment information.

---

## 3. Who Can Change What (Mutability)

**Golden Rule:** **Immutability of Voice.**
A user may never alter a record they did not author, even if they have "Admin" rights over the profile.

### A. Goalie
*   **Can Create:** Reflections, Log Game Stats.
*   **Can Edit:** Their *own* un-locked reflections (within 24h).
*   **Cannot Edit/Delete:**
    *   Notes written by Parent.
    *   Drills assigned by Coach.
    *   *Why:* Prevents "cherry-picking" feedback. If a Coach says "Work on glove hand," the Goalie cannot delete that instruction.

### B. Parent
*   **Can Create:** Observations ("He looked tired"), Incident Reports.
*   **Can Edit:** Their own notes.
*   **Cannot Edit:**
    *   **The Goalie's Reflection Body.**
    *   *Why:* To trust the AI, the input must be pure. A parent changing "I felt sad" to "I felt focused" breaks the AI's ability to detect burnout.
    *   *Proposed Fix for v11:* Implementation of `author_id` on `reflections` table to enforce this at the RLS level.

---

## 4. Intentionally Not Allowed (Anti-Patterns)
## 4. AI Trust Implementation: The "Small Model" Strategy

To satisfy the **Privacy** and **Safety** pillars without exposing user data to third-party LLMs (OpenAI/Anthropic) or incurring high costs, GoalieCard v11 uses a **Local Expert Engine**.

### A. The "Glass Locker Room" Logic
The AI does not "think" in the cloud. It runs deterministically on the client device.
1.  **Input:** User Mood + Reflection Text.
2.  **Processing:** `expert-engine.ts` scans for:
    *   **Safety Flags:** (e.g., "pain", "hurt") -> **STOP**.
    *   **Contradictions:** (e.g., "Happy" but text says "terrible") -> **Override**.
    *   **Success Patterns:** (e.g., "Won 4-0" but "Frustrated") -> **Validate**.
3.  **Output:** A pre-validated Recommendation object.

### B. Privacy Guarantee
*   **Zero Data Egress:** Reflection text never leaves the Supabase/Client secure loop.
*   **No "Hallucinations":** The AI cannot invent advice. It can only select from a curated library of 50+ approved drills and protocols.

---

1.  **"Ghost Mode"**: There is no incognito mode for the Goalie. All inputs are visible to the Guardian. This is a safety feature, not a bug.
2.  **"Proxy Typing"**: The system must distinguishing between a Parent logging a game *for* a child vs. the Child logging it.
    *   *Current Gap:* The "Baseline Check-in" does not currently cryptographically sign *who* pressed the button (Parent Device vs Goalie Device). v12 should fingerprint the session role.
3.  **Data Deletion by User**: Users can "Archive" entries, but `hard delete` is restricted to Admins (or GDPR requests) to preserve the integrity of the development arc.

---

## 5. Technical Implementation (The "How")

To enforce this Trust Model, the Database Schema must evolve:

```sql
alter table public.reflections 
add column author_id uuid references auth.users(id) default auth.uid(),
add column author_role text; -- 'goalie' | 'parent' | 'coach'

-- RLS Update (Conceptual)
create policy "Can Edit Own Words" on public.reflections
for update using (
  auth.uid() = author_id -- Only the writer can edit
);
```

*This document serves as the roadmap for the next sprint of permission hardening.*
