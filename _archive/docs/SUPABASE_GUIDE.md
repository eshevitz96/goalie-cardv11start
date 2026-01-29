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

The Admin Portal is now configured to accept your **export format** directly. You do not need to reformat your spreadsheet.

**Supported Column Order (Based on your export):**
No changes needed. Ensure your CSV has these columns in order:
*   (Col 1) Email Address
*   (Col 2) Player First Name
*   (Col 3) Player Last Name
*   (Col 4) Email
*   (Col 5) Player Graduation Year
*   (Col 7) Club Team Name
*   (Col 13) Guardian First & Last Name
*   (Col 16) Guardian Email (**Crucial**: This is used for account matching)

## 3. How Migration Works

1.  **Upload**: When you upload this CSV in the Admin Portal, the system will create "Pending" profile entries for each row.
2.  **ID Generation**: A unique GoalieCard ID (e.g., `GC-8821`) is generated for each entry.
3.  **Claiming**:
    *   When a parent goes to **Activate New Card**, they sign up using their email.
    *   The system checks the `Guardian Email` column in your uploaded roster.
    *   If a match is found, their account is instantly linked to the existing Goalie Profile and their Card is activated with the pre-assigned ID.
