# Project Roadmap: GoalieCard v1.1

**Current Date:** Feb 18, 2026
**Target Launch:** June 1, 2026

This roadmap outlines the critical path to a full public launch and the complete migration of legacy goalie training data.

---

## 📅 High-Level Timeline

| Phase | Duration | Dates | Focus |
| :--- | :--- | :--- | :--- |
| **1. Beta & Stabilization** | 4 Weeks | Feb 18 - Mar 15 | Testing, Bug Fixes, "Breaker" checks |
| **2. Data Migration Core** | 4 Weeks | Mar 16 - Apr 15 | Scripting, Mapping Legacy Data, Import Tests |
| **3. Feature Polish** | 4 Weeks | Apr 16 - May 15 | UI/UX Refinement, Admin Tools, Performance |
| **4. Pre-Launch** | 2 Weeks | May 16 - May 31 | Freeze, Final Regression, Marketing Prep |
| **5. LAUNCH** | 1 Day | **June 1, 2026** | Public Access, Legacy System Shutdown |

---

## 🚀 Detailed Phases

### Phase 1: Beta & Stabilization (Feb 18 - Mar 15)
*Goal: Ensure the "Happy Path" is broken-free and major flows work for the 5 pilot goalies.*

- [ ] **Beta Testing (5 Goalies):**
    - Execute `BETA_TEST_QUESTIONS.md` protocol.
    - Collect unstructured feedback via "Beta Feedback" button.
- [ ] **Code Review (3 Devs):**
    - Audit `actions.ts` for security loopholes.
    - optimize `useGoalieData` hook for unnecessary re-renders.
- [ ] **Critical Fixes:**
    - Resolve any P0/P1 bugs found during beta.
    - Ensure Mobile Safari (iOS) experience is smooth.

### Phase 2: Data Migration Core (Mar 16 - Apr 15)
*Goal: Move all historical training data from the legacy system/spreadsheets into Supabase.*

- [ ] **Data Mapping:**
    - Define schema limits: matching "Old Fields" -> "New Supabase Columns".
    - Handle missing data (e.g., default `grad_year` if unknown).
- [ ] **Migration Scripts:**
    - Write idempotent scripts (runnable multiple times without duplicating data).
    - `scripts/migrate_training_logs.ts`
    - `scripts/import_legacy_users.ts`
- [ ] **Validation:**
    - "Spot Check" 10 random goalies: Compare old data vs new app dashboard.

### Phase 3: Feature Polish & Admin Tools (Apr 16 - May 15)
*Goal: Make the app feel "Premium" and give Admins full power without needing a developer.*

- [ ] **App Store Setup:**
    - Create Apple App Store & Google Play Store listings.
    - Prepare screenshots (iPad + iPhone sizes).
- [ ] **Admin Dashboard (Desktop Focus):**
    - Full CRUD for Coaches (Add/Remove/Assign).
    - "Impersonation Mode": Admin can view dashboard *as* a specific goalie to debug.
- [ ] **UI/UX Delight (Mobile Focus):**
    - Native feel: Verify "Safe Areas" on iPhone 15/16.
    - Add micro-interactions (confetti on registration, smooth transitions).
- [ ] **Performance:**
    - Server-side caching for `EventsList`.
    - Database indexing for faster queries on `reflections` table.

### Phase 4: Pre-Launch (May 16 - May 31)
*Goal: Stability. No new features, only safety checks.*

- [ ] **Store Submission (CRITICAL):**
    - Submit "Release Candidate" to Apple/Google for review (allow 1 week for rejection/fixes).
- [ ] **Code Freeze:** No new features merged after May 15.
- [ ] **Load Testing:** Simulate 500 concurrent users booking an event.
- [ ] **Disaster Recovery:** Test a database restoration from backup.
- [ ] **Communication:** Send "Coming Soon" emails to the full email list.

### Phase 5: LAUNCH (June 1, 2026)
*Goal: Open the gates.*

- [ ] **DNS Switch:** Point main domain to the v1.1 App.
- [ ] **Monitoring:** Watch logs for 500 errors.
- [ ] **Celebration:** 🍻

---

## 🚦 Risk Assessment

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Migration Data Loss** | High | Run migration on staging environment first; keep legacy data read-only as backup. |
| **Mobile Safari Bugs** | Medium | Test strictly on actual iPhones, not just simulators. |
| **Scope Creep** | Medium | Strict "Code Freeze" date; move non-critical requests to v1.2. |
