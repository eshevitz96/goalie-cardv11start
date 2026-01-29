# GoalieGuard App: Compliance, Safety & Regulations Guide

As we build out the "Coach in Your Pocket" AI and collect personal data from minors (goalies), we must navigate several safety and regulatory landscapes.

## 1. COPPA (Children's Online Privacy Protection Act) & Minors
Since many users are under 18 (and potentially under 13), strictly adhering to COPPA is critical.
*   **Parental Consent:** Our current flow is strong here because **Parents** are the ones initializing the account and paying. We should maintain this "Parent-First" architecture.
*   **Transparency:** Parents must be able to see *what* data is being collected (e.g., the Journal entries).
*   **Recommendation:** Ensure the **Parent Dashboard** eventually has a "read-only" view of their child's journal entries (unless the child opts for privacy, which brings up family dynamic questions, but legally, parents usually own the account).

## 2. AI Disclaimer: "Coaching vs. Clinical"
We must be extremely clear about the scope of the AI's advice.
*   **The Line:** The AI provides **Performance & Mental Skills Coaching** (confidence, focus, tactical), NOT **Clinical Therapy** (depression, anxiety disorders, trauma).
*   **The Disclaimer:** Every "AI Chat" or "Advice" screen should have a subtle footer: *"GoalieGuard AI is a performance tool. It provides sports coaching, not medical or psychological diagnosis. In a crisis, contact a professional."*
*   **Regulation:** This protects you from liability if a user claims the AI gave "bad medical advice."

## 3. "Red Flag" Protocol (The Safety Net)
What happens if a user inputs something concerning?
*   **Scenario:** A goalie logs "Depressed" or "I want to quit" 5 days in a row.
*   **The Protocol:**
    1.  **AI Pause:** The AI should stop giving generic "hustle" advice.
    2.  **Escalation:** The system initiates an **automated alert to the Parent** (Primary). The Coach/Admin is carbon-copied (Secondary) for awareness.
    3.  **Human Intervention:** 
        *   **Primary:** The **Parent** receives the alert and decides on the course of action.
        *   **Restriction:** The Coach **does not** contact the child directly regarding these flags. The Coach only engages if the **Parent** reaches out to discuss the situation or explicitly requests intervention.

## 4. Data Privacy & "Right to be Forgotten"
*   **Journal Entries:** These are deeply personal.
*   **Encryption:** Supabase handles data encryption at rest, which is good.
*   **Deletion:** If a user leaves, we must have a mechanism to **permanently delete** their journal entries if requested (GDPR/CCPA compliance).

## 5. Development "Rules of the Road"
*   **Rule 1:** Never train the AI on user PII (Personally Identifiable Information) without anonymizing it first.
*   **Rule 2:** Avoid "Toxic Positivity." If a user signals burnout, the AI should suggest **Rest**, not **More Work**. (See `AI_SUCCESS_PROTOCOL.md`).
*   **Rule 3:** The Human is the final authority. Users should always be able to override an AI suggestion.

## Checklist for Next Steps
- [ ] Add "AI Disclaimer" text to the Terms of Service step.
- [ ] Design the "Parent View" of the Journal (Transparency).
- [ ] Build a simple "Keyword Flagging" system (e.g., if text contains "hurt", "pain", "quit" -> alert admin).
