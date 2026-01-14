# Supabase Setup & Roster Migration Guide

## 1. Setting up the Database

1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Go to the **SQL Editor** (the terminal icon on the left sidebar).
4.  Click **New Query**.
5.  Copy the contents of the `supabase_schema.sql` file (found in your project root) and paste it into the editor.
6.  Click **Run**.

This will create all the necessary tables: `profiles`, `sessions`, `schedule_requests`, and `reviews`.

## 2. Formatting Your Roster CSV

To migrate your "Master Book of Goalies" into the system via the Admin Portal, your CSV file should match the following column structure.

**Required Columns:**
*   `Goalie Name` (Text)
*   `Parent Email` (Text) - *This is the key used for auto-claiming accounts*
*   `YOB` (Number) - *Year of Birth*
*   `Team` (Text)

**Example CSV Content:**

```csv
Goalie Name,Parent Email,YOB,Team
Leo Vance,leovance@gmail.com,2008,U16 AAA Jr. Kings
Jamie Ross,mike.ross@email.com,2010,U14 AA Ducks
Tyler Smith,sarah.smith@email.com,2012,U12 A Kings
Jordan Lee,jlee@email.com,2009,U15 AAA Elite
```

## 3. How Migration Works

1.  **Upload**: When you upload this CSV in the Admin Portal, the system will create "Pending" profile entries for each row.
2.  **ID Generation**: A unique GoalieCard ID (e.g., `GC-8821`) is generated for each entry.
3.  **Claiming**:
    *   When a parent goes to **Activate New Card**, they sign up using their email.
    *   The system checks the `Parent Email` column in your uploaded roster.
    *   If a match is found, their account is instantly linked to the existing Goalie Profile and their Card is activated with the pre-assigned ID.
