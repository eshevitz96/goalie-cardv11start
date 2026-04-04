# Black Card Strategy & Revenue Flywheel

**Objective:** Map the high-ticket "outcome-based" business model to the GoalieCard technical infrastructure.

## 🏆 The Tiered Ecosystem Check
*Validating the proposed pricing against technical deliverables.*

### Tier 1: Standard Access ($99–$149/mo)
*The "Scalable Base". Pure SaaS.*
- **Value:** Training Log + Content Library + Basic AI.
- **Tech Stack:**
    - `TrainingInsights.tsx` (Automated)
    - `Reflections.tsx` (Self-guided)
    - `EventsList.tsx` (Booking access)
- **Verdict:** ✅ **Aligned.** This replaces the "random PDF" for the price of a gym membership.

### Tier 2: Elite Development ($500–$1,000/mo)
*The "Hybrid Model". SaaS + Human-in-the-Loop.*
- **Value:** Accountability + Custom Plans.
- **Tech Stack:**
    - **[NEW] Weekly Review Module:** Coach dashboard to "grade" a week.
    - **[NEW] Video Analysis:** Integration (e.g., Loom or internal upload) for async breakdown.
    - **[NEW] Direct Chat:** Gated messaging component.
- **Verdict:** ✅ **Aligned.** High margin because the *software* does 80% of the tracking; the coach adds the 20% high-value context.

### Tier 3: BLACK CARD ($2,000–$3,000/mo)
*The "Concierge/Status". Access & Network.*
- **Value:** Proximity, Status, "Done for You".
- **Tech Stack (The "Velvet Rope"):**
    - **UI:** Gold/Dark variants of the dashboard.
    - **Priority Queue:** Their support tickets/messages float to the top.
    - **Network Access:** "Recruiting Roadmap" feature (e.g., CRM for college coaches).
- **Verdict:** ✅ **Aligned.** This is not about features; it's about **access**. The app is just the portal to the VIP service.

---

## 🏎️ The Revenue Flywheel Architecture
*How software accelerates the loop.*

1.  **Acquisition (The Lead Magnet):**
    - Free/Low-cost "Assessment" tool in the app.
    - *Tech:* Public-facing "Goalie IQ Test" landing page.
2.  **Activation (Tier 1):**
    - User logs in, builds a streak.
    - *Tech:* Gamification (Streaks, Badges) hooked to `reflections`.
3.  **Ascension (The Up-Sell):**
    - Trigger: "You've logged 30 days. Ready for a pro review?"
    - *Tech:* Automated In-App Message (IAM) pitching Tier 2 upgrade.
4.  **Retention (The Lock-In):**
    - Tier 2/3 users get "Personal Evolution Arc" (long-term data viz).
    - *Tech:* Charting libraries visualizing 6+ months of progress. Leaving means losing this story.

---

## 🛠️ Technical Roadmap for "Black Card"
*What we need to build to sell this.*

1.  **Database Updates:**
    - Add `subscription_tier` enum to `profiles`.
    - Add `features_enabled` JSONB column for granular permissions.
2.  **UX "Delight" (The $3k feel):**
    - **Theme Engine:** "Black Card" users get a distinct, premium dark theme (gold accents).
    - **Concierge Widget:** A direct "Ask me anything" button that connects to the Founder/Head Coach, bypassing normal support.
3.  **The "Recruiting CRM":**
    - A simplified Kanban board for Tier 2/3 goalies to track college conversations.

## 💬 Recommendation on Pricing
**Yes, the prices align.**
- **$149** is low friction for determined parents.
- **$1,000** competes with "private lessons" but offers daily value vs weekly.
- **$3,000** is for the "1%" who want insurance that they are doing everything possible.

**Key Recommendation:**
Do NOT sell "more drills" for Tier 3. Sell **Certainty**.
The app must visually reinforce that Tier 3 is "inside the inner circle."
