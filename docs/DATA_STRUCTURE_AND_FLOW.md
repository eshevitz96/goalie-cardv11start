# GoalieCard Data Architecture

## Core Concept: "One User, Many Cards"
Instead of creating separate email logins for every stage of your career (which is annoying to manage), we structure it like a **Digital Wallet**. You log in once, and you carry multiple "Cards" that represent your different athletic identities.

## The Hierarchy

### 1. The User (The Keychain)
*   **Entity:** `auth.users` (Supabase Auth)
*   **Role:** The person logging in (e.g., `thegoaliebrand@gmail.com`).
*   **Permissions:** Can be a Goalie, Parent, Coach, or Admin (or all of them).

### 2. The Cards (The Identities)
*   **Entity:** `roster_uploads` table.
*   **Concept:** Each row in this table is a separate "Card".
*   **Elliott's Stack:**
    *   **Card A (HS Hockey):**
        *   **Sport:** Hockey
        *   **Team:** Ladue Rams
        *   **Context:** High School Stats, HS Events, HS Coach Feedback.
    *   **Card B (HS Lacrosse):**
        *   **Sport:** Lacrosse
        *   **Team:** Ladue Rams
        *   **Context:** Lax Stats, Lax Events, Lax Coach Feedback.
    *   **Card C (Pro Hockey):**
        *   **Sport:** Hockey
        *   **Team:** St. Louis Blues
        *   **Context:** Pro Stats, Pro Events, Pro Coach Feedback.

## Why this Structure?
1.  **Unified billing:** Parent pays once (or per card) but manages all payments in one portal.
2.  **Unified History:** As Elliott grows from HS to Pro, he doesn't "lose" his HS data; he just adds a new "Pro Card" to his collection.
3.  **Isolation:** The "Pro Coach" only sees the "Pro Card" data. The "HS Coach" only sees "HS Card" data. They don't get mixed up.

## The "Pro Profile" Question
You asked: *"then a completely different profile for the pro since now that elliott is playing only one sport?"*

*   **Technically:** It's still the **same login** (Profile), but a **different Card**.
*   **Visually:** When you swipe to the "Pro Card", the interface changes to reflect that context (only Hockey events, Pro styling).
*   **Functionally:** It acts like a different profile (different stats, different coaches), but you don't need a second password.

## Data Model Visualization
```mermaid
graph TD
    User[Elliott (User Login)] -->|Owns| Card1[HS Hockey Card]
    User -->|Owns| Card2[HS Lacrosse Card]
    User -->|Owns| Card3[Pro Hockey Card]

    Card1 -->|Linked To| Coach1[HS Hockey Coach]
    Card2 -->|Linked To| Coach2[HS Lax Coach]
    Card3 -->|Linked To| Coach3[Pro Coach]
```
