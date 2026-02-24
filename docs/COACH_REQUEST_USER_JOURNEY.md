# Pro Coach Request Flow - User Journey & Data Architecture

Here is the exact step-by-step flow for how a Base Tier goalie requests a personalized Coach, and how the data moves through the Goalie Card ecosystem.

---

## 1. The Goalie Perspective (Submission Flow)

**UX Journey:**
1. **Trigger:** The Goalie (or Parent) logs into their `dashboard`. Because they are on the "Base Tier" (no active `assigned_coach_id`), the Goalie Card displays a "Request Pro Coach" button.
2. **Step 1 - Coach Selection:** Clicking the button opens a modal. The system queries the `profiles` table to list all active coaches. The goalie selects their desired coach.
3. **Step 2 - Value & Terms:** The modal educates the user on the $300/mo cost and what the Pro Tier includes (4 lessons, video feedback, custom performance plans). The user *must* check a box agreeing to the billing change.
4. **Step 3 - The "Why":** The goalie enters a text pitch explaining their goals and why they want to work with this specific coach.
5. **Submission:** Upon clicking submit, the modal closes, and the request is sent to the backend.

**Database Action:**
When the goalie clicks submit, a new row is inserted into the `coach_requests` table:
*   `id`: UUID
*   `goalie_id`: `auth.users.id` (Who requested it)
*   `coach_id`: `profiles.id` (Who they want)
*   `roster_id`: `roster_uploads.id` (Their active card profile)
*   `goalie_why`: Text payload of their pitch.
*   `status`: `'pending'`
*   `created_at`: Timestamp

---

## 2. The Coach Perspective (Review Flow)

*Note: This part is what we will build next once the database table is confirmed.*

**UX Journey:**
1. **Notification:** The Coach logs into the `coach` dashboard.
2. **Review:** A new "Pending Requests" section appears, showing the Goalie's Name, Grad Year, and their "Goalie's Why" pitch.
3. **Decision:** The Coach has two options inside the UI:
    *   `Approve`: Accepts the goalie onto their private roster.
    *   `Deny`: Declines the request (with an optional reason).

**Database Action on APPROVE:**
1.  **Update Request:** The `coach_requests` row `status` changes from `'pending'` to `'approved'`.
2.  **Update Roster:** The `roster_uploads` table for that goalie is updated to permanently set `assigned_coach_id = [Coach's ID]`.
3.  **Billing Event:** A trigger (or server action logic) initiates the Stripe API to upgrade the user's subscription to the $300/Month tier. (If the card fails, the user is downgraded back to base).
4.  **UI Unlock:** The Goalie's dashboard updates to the "Pro View": Progress bars unlock, the Ai Coach transitions to real-coach reflection logic, and the "Message Coach" feature activates.

**Database Action on DENY:**
1.  **Update Request:** The `coach_requests` row `status` changes from `'pending'` to `'denied'`.
2.  **Notification:** The goalie receives an automated push or email letting them know the roster was full, and encouraging them to apply for another coach or stay grinding on the base tier.

---

## 3. The Downgrade / Drop Flow (Data Retention)

What happens if a Coach has a Pro Goalie on their roster, but decides they can no longer work with them (or the Goalies cancels their $300/mo subscription)?

**UX Journey:**
1. **Coach Action:** The Coach goes to their Dashboard, selects the Goalie, and clicks "Remove from Roster" (or changes status to Dropped).
2. **Goalie Experience:** The Goalie is downgraded to the $15/mo Base Tier. 
   - They **lose** access to direct Coach messaging and the 4 monthly hybrid lessons.
   - They **keep** all historical data: Past coach feedback, Training Journal entries, registered Events, and the core Protocol features.

**Database Action on DROP:**
1. **Update Roster:** The `roster_uploads` table updates to `assigned_coach_id = NULL` (or an archived array), effectively breaking the *active* link.
2. **Data Integrity:** Because feedback and journal entries are linked to the `id` of the `roster_uploads` table, *not* the Coach's active session, the data remains intact. The Goalie Card will simply render the historical feedback in a "Past Reports" read-only view.
3. **Billing Event:** A trigger initiates the Stripe API to downgrade the subscription from $300/mo back to $15/mo at the start of the next billing cycle.
