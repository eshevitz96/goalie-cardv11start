# Simulation Walkthrough: Tracing the Flaws

This document provides a step-by-step code trace of the "Baseline Stress Test" scenarios, proving exactly where the current implementation fails to meet the *GoalieCard v11 Trust Model*.

---

## Simulation 1: The "Text Blindness" (AI Logic Failure)

**Scenario:** An overconfident goalie enters a negative reflection but tags it as "Happy".
**Input:** 
*   **Text:** "I played terrible, let in 5 soft goals."
*   **Mood:** `happy` (User selection)

### Code Trace: `src/components/AiCoachRecommendation.tsx`

**Line 47:** The logic sets the `activeMood`.
```typescript
// Priority: Real-time Mood > Baseline Mood > Default
const activeMood = lastMood || baselineMood || 'neutral';
// Result: activeMood = 'happy'
```

**Line 49-56:** The Logic Engine executes the decision tree.
```typescript
if (activeMood === 'frustrated') {
    // ...
} else if (activeMood === 'happy' || activeMood === 'confident') {
   recommendation = {
       focus: "High-Intensity Flow",
       reason: "Momentum is high. Time to push the pace...",
       // ...
   };
}
```

**Line 110:** The UI renders the result.
```typescript
<h2 ...>{rec?.reason}</h2>
// Output: "Momentum is high. Time to push the pace..."
```

**Conclusion:** The System completely ignored the critical text input ("I played terrible"). It reinforced delusion instead of offering a reality check. **FAILED.**

---

## Simulation 2: The "Identity Collapse" (Parent as Goalie)

**Scenario:** A Parent activates the account and enters the initial baseline reflections for their U12 child.
**User State:** Logged in as `parent@gmail.com` (User ID: `auth_user_123`).

### Code Trace: `src/app/activate/page.tsx`

**Line 212:** The generic Auth User is fetched.
```typescript
const { data: { user } } = await supabase.auth.getUser();
// Result: user.id = 'auth_user_123' (The Parent)
```

**Line 214-221:** The Reflection object is constructed.
```typescript
const entries = baselineAnswers.map(ans => ({
    roster_id: rosterData.id,
    goalie_id: user?.id, // <--- CRITICAL ERROR
    title: "Baseline: " + ans.question,
    // ...
}));
```

**Database Result:**
| id | roster_id | goalie_id | content |
| :--- | :--- | :--- | :--- |
| b-1 | r-99 | **auth_user_123** | "He needs to work on his glove." |

**Line 223:** Insert into Database.
The AI now assumes `auth_user_123` is the Goalie. If the Parent later tries to effectively "hand off" the device or if the request comes from the "Goalie" persona, the history is attributed to the wrong human.

**Conclusion:** The system cannot distinguish between a Goalie Self-Assessment and a Parent Observation. The training data is contaminated. **FAILED.**

---

## Simulation 3: The "History Rewrite" (Permission Leak)

**Scenario:** A Parent wants to change a reflection written by the Goalie because they disagree with the mood.
**RLS Policy:** `create_init_reflections.sql`

### Policy Trace

**Goalie's Reflection:**
| id | roster_id | content | mood |
| :--- | :--- | :--- | :--- |
| r-55 | r-99 | "I felt tired." | frustrated |

**Parent Action:** Attempts `UPDATE` on row `r-55`.

**Line 16-23:** The Database checks permission.
```sql
create policy "Manage reflections" on public.reflections
for all using (
  -- 1. Owner of Roster Entry (Parent)
  exists (
    select 1 from public.roster_uploads r 
    where r.id = reflections.roster_id 
    and lower(r.email) = lower(auth.jwt() ->> 'email') // MATCH!
  )
  OR ...
);
```

**Result:** The `exists` check passes because the Reflection belongs to the Roster `r-99`, which is owned by the Parent's email.
**Outcome:** Database grants `UPDATE`. Parent changes "frustrated" to "neutral".

**Conclusion:** The "Immutability of Voice" is violated. The internal state of the athlete has been externally altered. **FAILED.**
