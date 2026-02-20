# Data Migration Plan (Legacy -> GoalieCard v1.1)

**Target Date:** Mar 16 - Apr 15, 2026
**Objective:** Import all internal goalie training data so that when they log in, they see their history.

## 1. Source Data Assessment
**Format:** Excel (.xlsx) containing the following columns:
- `Goalie Name` (e.g., "Aaron Cline") -> Needs mapping to Auth `user_id`.
- `Session Number` (e.g., "1") -> Maps to `session_number`? Or part of a package?
- `Lesson Number` (e.g., "1", "2") -> Maps to `lesson_number`?
- `Start DateTime` / `End DateTime` -> Maps to `date` and `duration`.
- `Location` -> Maps to `location`.
- `Notes` -> Maps to `reflections` or `coach_notes`.

**Critical Challenge:**
We have **Names** (e.g., "Aaron Cline") but the database uses **Emails/UserIDs**.
*Solution:* We will generate a `name_to_email_mapping.csv` first for you to fill out.

## 2. The Migration Script Strategy
We will build a robust script `scripts/migrate_legacy_data.ts` that:
1.  **Reads** the source file (CSV/JSON).
2.  **Finds** the user in Supabase by Email.
3.  **Inserts** records into:
    - `roster_uploads` (if not exists)
    - `sessions` (training history)
    - `reflections` (notes/feedback)
4.  **Idempotency:** The script must be runnable multiple times without creating duplicates.

## 3. Validation
- **Dry Run:** Run the script in "Check Mode" to see how many records *would* be inserted.
- **Spot Check:** Manually verify 3-5 key goalies.

## 4. Next Steps for You
In order to write the script, I need to know:
1.  **What format is your data in?** (CSV, Excel, etc.)
2.  **Can you provide a small sample?** (Anonymized rows).
