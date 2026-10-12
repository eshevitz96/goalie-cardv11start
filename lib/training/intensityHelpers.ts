/**
 * Item-level intensity mapper based on coaching requirements:
 * - warm-up/mobility: RPE 3-4
 * - strength: RPE 7-8 (RPE 6 on taper maintenance)
 * - power: Quality-focused
 * - recovery: RPE 2-3
 * - pre-game sessions: RPE 3-4 (mobility) / RPE 2-3 (recovery)
 */
export function getExerciseIntensity(
    category: string,
    options?: {
        isPreGame?: boolean;
        isPostGame?: boolean;
        isTaper?: boolean;
    }
): string {
    const cat = (category || '').toLowerCase();

    if (options?.isPreGame) {
        if (cat === 'recovery') return "RPE 2-3 (Gentle Decompression)";
        return "RPE 3-4 (Fluid Mobility / Light Activation)";
    }

    if (options?.isPostGame) {
        return "RPE 2-3 (Restorative Flush)";
    }

    if (options?.isTaper) {
        if (cat === 'mobility' || cat === 'warmup') return "RPE 3-4 (Fluid Activation)";
        if (cat === 'recovery') return "RPE 2-3 (Gentle Decompression)";
        if (cat === 'strength') return "RPE 6 (Taper Maintenance - Crisp Control)";
        if (cat === 'power') return "Quality-focused (Max Velocity, Low Volume)";
        if (cat === 'reaction' || cat === 'sport') return "Quality-focused (Peak Ocular Tracking, Zero Fatigue)";
        return "RPE 5-6 (Taper Maintenance)";
    }

    switch (cat) {
        case 'mobility':
        case 'warmup':
            return "RPE 3-4 (Activation & Flow)";
        case 'recovery':
            return "RPE 2-3 (Gentle Decompression)";
        case 'strength':
            return "RPE 7-8 (Heavy Controlled Effort)";
        case 'power':
            return "Quality-focused (Explosive Intent, Max Velocity)";
        case 'reaction':
            return "Quality-focused (Peak Visual Tracking, Sub-Maximal Fatigue)";
        case 'sport':
            return "RPE 6-7 (Technical Crease Precision)";
        case 'conditioning':
            return "RPE 7-8 (Structured Conditioning Effort)";
        default:
            return "RPE 6-7";
    }
}
