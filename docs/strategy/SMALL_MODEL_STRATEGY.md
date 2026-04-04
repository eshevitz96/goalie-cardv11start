# GoalieCard v11 — The "Small Model" Strategy

## The Challenge
We want **Intelligence** (Context-Awareness) without the recurring cost or privacy risk of a giant external LLM (OpenAI/Anthropic). We want a system that starts simple and "learns" locally.

## The Solution: A "Vector-Lite" Decision Engine

Instead of paying $0.03 per API call to ask ChatGPT "What drill should I do?", we will build a **Local Logic Graph** that mimics intelligence by matching *Inputs* (Mood + Text Keywords) to *Outputs* (Drills) using a weighted scoring system. This is how video games handle AI—it feels smart, but it's actually math.

### How it "Learns" Locally
1.  **The Seed:** We define 50+ specialized feedback rules (The "Expert Knowledge").
2.  **The Feedback Loop:** When a goalie accepts a recommendation (e.g., clicks "Start Drill"), we increment a `relevance_score` for that rule + that specific goalie profile type.
3.  **The Evolution:** Over time, the system realizes "U18 goalies who say 'tired' prefer 'Visual Tracking', not 'Sprints'."

---

## Technical Implementation Plan

### 1. The `ExpertRules` Dictionary
We replace the `if/else` with a structured JSON ruleset.

```typescript
type Rule = {
  keywords: string[];          // ["terrible", "suck", "bad"]
  moods: string[];            // ["happy", "neutral", "frustrated"]
  required_context?: string;   // e.g., "post-game" vs "practice"
  recommendation: {
    focus: string;
    reason: string;
    drill_id: string;
  };
  weight: number;             // Importance (Priority)
}
```

### 2. The `ContextEngine` (Client-Side)
This simply runs a "Check":
`Input Text` -> `Tokenize` -> `Match Keywords` -> `Filter by Mood` -> `Sort by Weight`.

### 3. Example Scenario: "The Delusional Goalie"
*   **Input:** "I was terrible." + Mood: `Happy`.
*   **Rule A (Happy):** If Mood=Happy -> Rec="Flow Drill". Weight: 1.
*   **Rule B (Terrible):** If Text contains "terrible" -> Rec="Reality Check/Video Review". **Weight: 10**.
*   **Result:** Rule B wins. The system ignores the "Happy" mood because the *Text Signal* was stronger.

### 4. Implementation Steps
1.  Create `src/lib/expert-rules.ts` (The Brain).
2.  Update `AiCoachRecommendation.tsx` to use this engine instead of `if/else`.
3.  (Future) Store "Successful Matches" in Supabase to track what works.

**Cost:** $0.
**Privacy:** 100% Local.
**Latency:** 0ms.

---
*Ready to build the Expert Engine?*
