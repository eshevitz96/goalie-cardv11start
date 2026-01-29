# User Acceptance Testing Guide: Admin, Coach, & Goalie Loop

This guide outlines the steps to validate the complete user journey using the newly implemented Unified Auth Flow and Admin functionalities.

## Prerequisites
- Local Server running (`npm run dev`) at `http://localhost:3000`.
- **Demo Mode** or **Real Mail**?
  - For **Admin Validation**, we have enabled a specific **Backdoor Account** that grants Admin privileges without needing manual database intervention.

---

## Part 1: Admin & Roster Management

### 1. Log In as Admin
1. Navigate to [http://localhost:3000/login](http://localhost:3000/login).
2. Enter the **Validation Email**: `elliott.validate@goalieguard.com`
3. Click **Send Verification**.
4. Enter OTP: `000000` (Demo Bypass).
5. **Critcal Step**: Enter Birthday `1997-02-07`.
   - *Note: This specific email combined with the auth flow triggers an automatic role promotion to 'admin'.*
6. You should be automatically redirected to the **Admin Dashboard** (`/admin`).

### 2. Create a New Goalie (Roster Spot)
1. On the Admin Dashboard, look for the **"Roster Database"** table.
2. Click the **+ Add** button (top right of the table).
3. Fill in the details for a test user:
   - **First Name**: Test
   - **Last Name**: Goalie
   - **Email**: `test.goalie@goalieguard.com`
   - **Team**: Arizona High
   - **Grad Year**: 2030 (This ensures they are treated as a minor/parent initially, or use 2005 for Pro).
   - **Assigned Coach**: Select a coach from the dropdown (if available).
4. Click **Save**.
5. Verify the new row appears in the table. Note the **ID** (e.g., `GC-8XXX`).

---

## Part 2: Goalie/Parent Logic & Connection

### 1. Log In as the New User
1. Open a **New Private/Incognito Window**.
2. Navigate to [http://localhost:3000/login](http://localhost:3000/login).
3. Enter the email you just added: `test.goalie@goalieguard.com`.
4. Click **Send Verification**.
5. Enter OTP `000000`.
6. Enter Birthday:
   - If you want **Parent View**: Enter `2015-01-01`.
   - If you want **Goalie View**: Enter `2000-01-01`.
7. Accept Terms.
8. Enter Name Info (should pre-populate or update what you set in Admin).
9. Click **Enter Ecosystem**.

### 2. Verify Access & Connection
- **Goalie View**: You should land on `/goalie` and see:
  - Your Name ("Test Goalie")
  - Your Team ("Arizona High")
  - **Coaches Corner**: Ensure the coach you assigned in Admin is displayed here.

- **Parent View**: You should land on `/parent` and see:
  - The "Test Goalie" listed in your family/account card.

---

## Part 3: Coach Connection (Optional)
If you have access to a Coach account:
1. Log in as the Coach.
2. Navigate to `/coach`.
3. Verify that "Test Goalie" appears in your **Active Roster** list.
