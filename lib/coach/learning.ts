import { AthleteProfile, Reflection, LearningResult } from "./types";

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Pure, deterministic Learning Service.
 * Takes the raw Reflection data from the athlete and the current profile,
 * infers updates, applies learning logic, and returns the deltas and updated profile.
 */
export function processReflection(
    reflection: Reflection,
    profile: AthleteProfile,
    bottleneckType: string
): LearningResult {
    // 1. Calculate delta metrics based on the bottleneck targeted in the mission
    let balanceDelta = 0;
    let landingDelta = 0;
    let conditioningDelta = 0;

    if (bottleneckType === "right_side_balance" || bottleneckType === "Right-Side Balance") {
        if (reflection.balanceRating >= 7) balanceDelta = 0.5;
        else if (reflection.balanceRating <= 4) balanceDelta = -0.2;
    }
    if (bottleneckType === "landing_quality" || bottleneckType === "Landing Quality") {
        if (reflection.landingRating >= 7) landingDelta = 0.5;
        else if (reflection.landingRating <= 4) landingDelta = -0.2;
    }
    if (bottleneckType === "conditioning" || bottleneckType === "Conditioning") {
        if (reflection.conditioningRating >= 7) conditioningDelta = 0.5;
        else if (reflection.conditioningRating <= 4) conditioningDelta = -0.2;
    }

    // Compute new baselines (bounded between 1.0 and 10.0)
    const newBalance = Math.min(10, Math.max(1, profile.baselines.balance + balanceDelta));
    const newLanding = Math.min(10, Math.max(1, profile.baselines.landing + landingDelta));
    const newConditioning = Math.min(10, Math.max(1, profile.baselines.conditioning + conditioningDelta));

    // 2. Draft coach insights from learning update
    const insights: string[] = [];
    if (balanceDelta > 0) {
        insights.push(`Balance baseline increased: ${profile.baselines.balance.toFixed(1)} → ${newBalance.toFixed(1)}. Stable right leg landings detected.`);
    }
    if (landingDelta > 0) {
        insights.push(`Landing baseline increased: ${profile.baselines.landing.toFixed(1)} → ${newLanding.toFixed(1)}. Soft landings proved.`);
    }
    if (conditioningDelta > 0) {
        insights.push(`Conditioning baseline increased: ${profile.baselines.conditioning.toFixed(1)} → ${newConditioning.toFixed(1)}. Good aerobic index.`);
    }

    const newFatigue = reflection.energy <= 4 ? "high" : "moderate";
    if (newFatigue === "high") {
        insights.push("High fatigue detected during reflection. Tomorrow's mission will automatically trigger a recovery deload.");
    }

    if (insights.length === 0) {
        insights.push("Baselines steady. Coach Engine recommends maintaining current progression load tomorrow.");
    }

    // 3. Assemble updated profile
    const updatedProfile: AthleteProfile = {
        ...profile,
        baselines: {
            balance: newBalance,
            landing: newLanding,
            conditioning: newConditioning
        },
        recentFatigueLevel: newFatigue,
        previousMissionCompleted: true,
        totalCompletedMissions: profile.totalCompletedMissions + 1,
        learnedInsights: insights
    };

    return {
        learning_update_id: generateUUID(),
        athlete_id: profile.user_id,
        previousProfile: { ...profile },
        updatedProfile,
        insights,
        deltas: {
            balanceDelta,
            landingDelta,
            conditioningDelta
        }
    };
}
