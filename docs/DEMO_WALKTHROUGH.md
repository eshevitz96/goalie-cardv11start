# Goalie Portal - Demo & Research Walkthrough

## 1. Overview
This document outlines the "Real Goalie Journey" demo, designed to test AI directives, event filtering, and the user loop from signup to coach feedback.

**Target Users for Demo:**
1.  **Elliott Shevitz** (17yo, Hockey & Lacrosse) - `thegoaliebrand@gmail.com`
2.  **Luke Grasso** (Freshman, Lacrosse) - `luke.grasso@example.com` (Simulated/Placeholder)

---

## 2. Test Scenarios

### A. AI Directives (Stress Test)
**Goal:** Verify the "Coach within the Pocket" responds correctly to user states.

1.  **Empty/Null State**:
    *   **Action**: Login as a new user with no prior reflections.
    *   **Expected**: The `AiCoachRecommendation` component should display a default/neutral directive (e.g., "Hand-Eye Activation: Maintenance day").
2.  **Bad/Conflicting Inputs**:
    *   **Action**: Submit a reflection with `mood: "frustrated"`.
    *   **Expected**: Directive changes to "Reset & Simplify" (Focus: Mental Reset).
    *   **Action**: Submit a reflection with `mood: "happy"`.
    *   **Expected**: Directive changes to "High-Intensity Flow" (Focus: Push the pace).
3.  **Parent vs Goalie View**:
    *   **Action**: Login as Parent (`/parent`).
    *   **Expected**: The Parent Portal now displays the **same** AI Directive that the goalie sees, ensuring alignment on training focus.

### B. Event Filtering (Stress Test)
**Goal:** Verify multi-sport athletes see relevant events.

1.  **Multi-Sport User (Elliott)**:
    *   **Profile**: `sport: "Hockey, Lacrosse"`
    *   **Events Available**:
        *   "St. Louis Hockey Showcase" (`sport: Hockey`)
        *   "NCAA Lacrosse Combine" (`sport: Lacrosse`)
    *   **Expected**: Elliott sees **BOTH** events in his dashboard list.
2.  **Single-Sport User (Luke)**:
    *   **Profile**: `sport: "Lacrosse"`
    *   **Expected**: Luke sees **ONLY** the Lacrosse events (and any 'Open' events with no sport specified).
3.  **Null Sport Edge Case**:
    *   **Action**: Profile has no sport defined.
    *   **Expected**: User sees all events (fallback to open).

---

## 3. The "Real Goalie Journey" Narrative

**(1) Signup & Setup (Pre-Demo)**
*   Admin runs `setup_test_scenario.sql` to seed Users and Events.
*   Elliott & Luke are linked to their respective coaches.

**(2) The Check-In (Day 0)**
*   **User**: Elliott logs in (`/goalie`).
*   **View**: Sees "Performance Insight" at the top.
*   **State**: Neutral (No data).
*   **Action**: clicks "Add Reflection".
    *   *Input*: "Feeling overwhelmed with school and playoffs."
    *   *Mood*: Frustrated.

**(3) The Directive (Immediate Feedback)**
*   **System**: Updates `latestMood`.
*   **View**: The Dashboard refreshes.
*   **AI Coach**: Updates to "Reset & Simplify".
    *   *Drill*: "Box Breathing & Visualization" (5 mins).
    *   *Reason*: "Detected frustration. Reset & Simplify."
*   **Outcome**: Elliott knows exactly what to do *today* without asking his coach.

**(4) The Coach Loop**
*   **Action**: Coach (Coach Prime) logs in (`/coach` - theoretical).
*   **View**: Sees Elliott's reflection and the AI directive assigned.
*   **Outcome**: Coach knows Elliott is stressed and can adjust the next practice session accordingly.

---

## 4. Technical Verification
*   **Database**: `events` table updated with `sport` column.
*   **Logic**: `page.tsx` (Goalie & Parent) updated to split `sport` string (e.g., `['Hockey', 'Lacrosse']`) and filter `events` correctly.
*   **Parent Portal**: Now uses Real Data (Simulation Mode Removed) and includes `AiCoachRecommendation`.
