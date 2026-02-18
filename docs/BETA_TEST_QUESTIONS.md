# Beta Test & Code Review Protocol

**Date:** Feb 18, 2026
**Version:** 1.0

This document outlines the testing protocol for the upcoming closed beta (5 Goalies) and code review (3 Developers).

---

## Part 1: Goalie Beta Test Protocol (User Experience)

**Objective:** Validate usability, flow, and "delight" factors. We want to ensure the app feels intuitive and valuable.

### 👤 Profile & Onboarding
- [ ] **Login Flow:** Was it easy to sign in? Did the magic link/OTP work on the first try?
- [ ] **First Impressions:** When you first landed on the dashboard, was it clear what you should do next?
- [ ] **Profile Data:** Does your name, team, and jersey number appear correctly?
- [ ] **Mobile Responsiveness:** (If on phone) Does the layout feel natural? Is anything cut off?

### 🥅 Dashboard & Daily Use
- [ ] **Mood Check-in:** tap a mood icon. Did it feel responsive?
- [ ] **"Coaches Corner":** Can you see your assigned coach?
- [ ] **Notifications:** Did you notice any alerts (e.g., "Event Tomorrow")? Were they helpful or annoying?

### 📝 Reflections & Journaling
- [ ] **New Entry:** Try logging a "Post-Game Report" or standard "Journal Entry".
    - Was the form easy to fill out?
    - Did the "Analysis" or "AI Feedback" (if active) make sense?
- [ ] **History:** Can you easily find a past entry you wrote?

### 📅 Events & Training
- [ ] **Registering:** Try to "Register" for an upcoming event. Did you get a confirmation toast?
- [ ] **Drills:** Access the "Training Insights" or "Drill Library". Do the videos load quickly?
- [ ] **Flow vs. Database:** Does the app feel like a continuous "Flow" (guiding you what to do) or just a static database?

### 🤖 AI Protocol vs. Static
- [ ] **AI Recommendation:** Did the AI Daily Suggestion feel relevant to your recent mood/games?
- [ ] **Comparison:** Would you prefer this dynamic suggestion over a static PDF training calendar? Why?

### 🔄 Feedback Loop
- [ ] **Rate the Coach:** After receiving feedback on a journal, could you "Rate" the helpfulness?
- [ ] **Response Time:** Did you feel pressure (good or bad) to respond to a coach within 24 hours?

---

## Part 2: Parent / Guardian Protocol (Critical for <18)

**Objective:** Validate the "Payer" experience. Parents control the credit card and schedule.

### 🛡️ Parent Controls
- [ ] **Approval Messaging:** Did you receive a notification when your goalie requested an event?
- [ ] **Approval Messaging:** Did you receive a notification when your goalie requested an event?
- [ ] **Dashboard Visibility:** Does the Parent Dashboard clearly show your child's upcoming schedule? (What else would you like to see?)
- [ ] **Payment Flow:** Is it clear what "Tier" you are paying for?
    - *Question:* How much would you expect to pay for this "Pro" tier? (See Pricing Section).

### 📊 Reporting
- [ ] **End of Season Report:** Would a generated PDF "Season Summary" be valuable to you?
- [ ] **Historical Data:** Can you easily export or view your child's progress over the last 6 months?

---

## Part 3: Coach & Pro Organization Protocol

**Objective:** Validate "Command Center" features for GMs and Head Coaches.

### ⚡ Coaching Controls
- [ ] **Roster Sentiment:** Check the Dashboard. Is there a "System Message" alerting you if >20% of your roster is reporting negative moods?
- [ ] **Hierarchy:** (If applicable) Can the "GM" see all coaches, while "Trainers" only see health stats?
- [ ] **Response Monitoring:** Can you see which players haven't responded to feedback in >24 hours?

---

## Part 4: Business Logic & Pricing Research

**Objective:** Validate the business model.

### 💰 Pricing Tiers (Interview Questions)
- **Base Tier:** (Access to logs + Static drills). What is a fair monthly price?
- **Pro Tier:** (AI Protocols + Coach Feedback + Season Reports).
    - *Hypothesis:* We are targeting $X/month. Does this feel like high value?
- **Retention:** How far back do you expect the system to keep data? (Forever? 1 Year?)

---

## Part 5: High-Ticket Value Validation (The "Black Card" Psychology)
*Objective: Test if users value "Status & Accountability" over just "More Drills".*

- [ ] **Accountability vs Content:** "Would you pay more for a library of 1000 drills OR for a coach to check your logs every Sunday?"
- [ ] **Status:** "If this app offered a 'Black Card' membership that gave you direct access to pro webinars and a special badge, would that appeal to you?"
- [ ] **The "Inner Circle":** "Do you feel more like a 'Pro' when using this app compared to using a spreadsheet or paper journal?"

---

## Part 6: Developer Code Review (Architecture & Security)

**Objective:** Ensure code quality, security best practices, and scalability.

### 🔐 Security & Data Integrity (`actions.ts` & Supabase)
- [ ] **RLS Policies:** specific check on `reflections` table. Can a user *actually* read someone else's journal by changing the ID in the network request? (Verify RLS is active).
- [ ] **Admin vs. Client:** In `actions.ts`, are we correctly using `supabaseAdmin` only when necessary (e.g., role promotion) and `supabaseUser` for standard user actions?
- [ ] **Input Validation:** Are we validating `rosterId` and `entryData` types before passing them to the DB?

### 🏗️ Component Architecture (`page.tsx` & `/components`)
- [ ] **Server vs. Client Components:** Are we minimizing `"use client"` directives?
    - *Check:* Is `GoalieDashboard` really needing to be a client component, or can specific interactive parts be isolated?
- [ ] **Data Fetching:** Are we avoiding waterfalls?
    - *Check:* `useGoalieData` hook vs Server Component fetching in `page.tsx`.
- [ ] **Prop Drilling:** Are we passing `rosterId` down too many levels? Should we use a Context or Composition?

### ⚡ Performance & Optimization
- [ ] **Bundle Size:** Check `import { motion } ...`. Are we importing the whole library or just what we need?
- [ ] **Image Optimization:** Are goalie profile pics using `next/image` with proper sizing?
- [ ] **Re-renders:** Use React DevTools. Does typing in the "Journal" text area cause the entire Dashboard to re-render?

### 🧹 Code Quality
- [ ] **Type Safety:** Are there excessive `any` types in `actions.ts` or `hooks/useGoalieData.ts`?
- [ ] **Error Handling:** Do server actions return structured errors (`{ success: false, error: ... }`) that the UI handles gracefully?
- [ ] **Hardcoded Values:** Are there any magic strings (e.g., specific email addresses) left in the code from debugging?

---

## Feedback Submission
Please compile your findings and submit them via:
- **Goalies:** The in-app "Beta Feedback" button (bottom right).
- **Developers:** Pull Request comments or a dedicated Notion doc.
