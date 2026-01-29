# Baseline Stress Test Log & Permission Audit

## 1. Baseline Stress Test (Simulated)

**Protocol:** Running 5 scenarios through the Activation Baseline Check-In and AI Recommendation Engine.
**Current Logic:** 
- **Input:** `ActivatePage` saves `mood` (happy/neutral/frustrated) and `content`.
- **Processing:** `AiCoachRecommendation` fetches the baseline reflection.
- **Decision:** It purely uses `mood` to determine the recommendation. 
  - Frustrated -> "Reset & Simplify"
  - Happy/Confident -> "High-Intensity Flow"
  - Other/Neutral -> "Hand-Eye Activation"
- **Safety:** Checks for keywords (quit, pain, etc.) and sends notification.

### Scenarios

| Scenario | Input Detail | AI Behavior (Current) | Expected Behavior (Ideal) | Gap Identified |
| :--- | :--- | :--- | :--- | :--- |
| **1. Overconfident Goalie** | Text: "I am the best, nothing to learn."<br>Mood: Happy | **Recommendation:** "High-Intensity Flow"<br>Reason: "Momentum is high..." | **Challenge:** Should detect potential arrogance or lack of self-awareness. specific drill to test focus, not just "flow". | AI ignores text content. Blindly reinforces confidence even if misplaced. |
| **2. Uncertain Goalie** | Text: "I don't know if I'm ready."<br>Mood: Neutral | **Recommendation:** "Hand-Eye Activation"<br>Reason: "Maintenance day." | **Reassurance:** Should identify uncertainty and offer confidence-building "easy wins" or structure. | "Maintenance" sounds dismissive to an uncertain athlete. |
| **3. Parent-entered** | Text: "He looks tired." (Entered by Parent)<br>Mood: Frustrated | **Recommendation:** "Reset & Simplify" (Directed at Goalie) | **Distinguish Source:** Should attribute to Parent and NOT change Goalie's internal mood state/recommendation directly without validation. | No distinction between Pilot (Goalie) and Co-Pilot (Parent) inputs. Goalie might get a "Reset" drill when they feel fine. |
| **4. Empty Reflection** | Text: "" (Empty)<br>Mood: Neutral (Default) | **Recommendation:** "Hand-Eye Activation" | **Probe:** "You left this blank. tough day or just focused?" | System defaults to "Maintenance" instead of engaging the user to provide data. |
| **5. Conflicting Info** | Text: "I played terrible, let in 5 goals."<br>Mood: Happy | **Recommendation:** "Reality Check"<br>Reason: "You noted a poor performance..." | **Conflict Detection:** "You said you played bad but marked Happy. Let's unpack that." (Scenario B in Protocol). | ✅ **PASSED (v2.0 Local Expert)**. The Logic Engine ignores the "Happy" tag and prioritizes the "terrible" keywords. |

### Summary of Gaps
1.  **Text Blindness**: ✅ **SOLVED**. The `expert-engine.ts` scans for keywords and overrides the mood.
2.  **Source Ambiguity**: ✅ **SOLVED**. The schema and UI now support `author_role` to distinguish inputs.
3.  **Static Logic**: ✅ **UPGRADED**. Moved from hardcoded `if/else` to a weighted `ExpertRule` dictionary that "simulates" reasoning.

---

## 2. Permission Edge-Case Audit

**Goal:** Prove system resistance to misuse.

### A. Parent Edits Goalie Reflection
*   **Test:** Parent logs in, finds a reflection created by the Goalie (shares `roster_id`).
*   **Result:** **SUCCESS (Misuse Possible).**
    *   RLS Policy: "Manage reflections" allows updates if `roster_id` matches the parent's roster email.
    *   **Impact:** A parent can rewrite a goalie's journal entry, potentially gaslighting the historical record or altering AI inputs.
    *   **Fix:** Split permissions. Parent should have `SELECT` on Goalie entries, but `INSERT/UPDATE` only on their own distinct entries (which need a new `author_role` column).

### B. Goalie Edits Parent Note
*   **Test:** Parent writes a note "Kid is lazy".
*   **Result:** **SUCCESS (Misuse Possible).**
    *   If the note is saved with `goalie_id` linked (to show up in the feed), the RLS policy `(auth.uid() = goalie_id)` allows the goalie to `UPDATE` or `DELETE` it.
    *   **Impact:** Goalie can delete critical feedback from the parent/coach.
    *   **Fix:** RLS must check `created_by` (user_id) for UPDATE/DELETE operations, not just `goalie_id` ownership.

### C. Logged-in User Accesses Wrong Roster
*   **Test:** User A attempts to view/edit Reflections for Roster B (different email).
*   **Result:** **FAIL (Secure).**
    *   RLS Policy strictly checks `exists (select 1 from roster_uploads where id = request.roster_id AND email = auth.email)`.
    *   Unless User A is the admin, they cannot see Roster B's data.

### D. Admin Impersonation
*   **Test:** User sets `role: 'admin'` in local storage or sends fake request.
*   **Result:** **FAIL (Secure).**
    *   Supabase checks the JWT/Database `role` column in `public.profiles`. Client-side tampering won't bypass RLS.
    *   **Risk:** If `make_me_admin.sql` is left accessible via an unprotected API (it is currently just a SQL snippet, not an API route).
