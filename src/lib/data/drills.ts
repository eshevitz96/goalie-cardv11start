import { DrillDef } from "@/lib/expert-engine";

export interface ExtendedDrillDef extends DrillDef {
    id: string;
    category: 'physical' | 'mental' | 'recovery';
    description?: string;
    targetIndices?: string[]; // e.g. ['stability', 'execution']
}

export const DRILL_REPOSITORY: ExtendedDrillDef[] = [
    {
        id: 'visual-gaze-tuning',
        name: "Visual Gaze Tuning",
        duration: "12 MIN",
        type: "mental",
        category: "mental",
        description: "Calibrate neural pathways for rapid cross-crease tracking.",
        steps: ["Fixation point holds", "Saccadic eye movements", "Peripheral awareness focus"],
        targetIndices: ['execution']
    },
    {
        id: 'lower-body-excellence',
        name: "Lower Body Excellence",
        duration: "20 MIN",
        type: "physical",
        category: "physical",
        description: "Enhance explosive lateral power and structural stability.",
        steps: ["Lateral box jumps", "C-Cut explosive starts", "Deep butterfly recovery reps"],
        targetIndices: ['stability']
    },
    {
        id: 'neural-reset-mobility',
        name: "Neural Reset Mobility",
        duration: "12 MIN",
        type: "physical",
        category: "recovery",
        description: "Readiness is low. Focus on neural flow and mobility.",
        steps: ["Box breathing (5 mins)", "Hip & Ankle active release", "Slow visual tracking"],
        targetIndices: ['readiness']
    },
    {
        id: 'steady-stance-series',
        name: "Steady Stance Series",
        duration: "10 MIN",
        type: "physical",
        category: "physical",
        description: "Solidify your base and improve weight distribution.",
        steps: ["Single leg balance (30s each)", "C-Cut stability holds", "Depth management transitions"],
        targetIndices: ['stability']
    },
    {
        id: 'neural-reset-neural',
        name: "V11 Neural Reset",
        duration: "5 MIN",
        type: "mental",
        category: "mental",
        description: "Stabilize your gaze and heart rate to prepare for high-intensity tracking.",
        steps: ["Box Breathing", "Gaze Tuning", "Neural Reset"],
        targetIndices: ['readiness', 'execution']
    },
    {
        id: 'crease-dominance',
        name: "Crease Dominance",
        duration: "15 MIN",
        type: "physical",
        category: "physical",
        description: "Master post-to-post integration and rotation.",
        steps: ["T-Push to top", "Butterfly slide", "Post-to-post rotation"],
        targetIndices: ['stability', 'execution']
    }
];

export function getRecommendedDrills(count: number = 2): ExtendedDrillDef[] {
    // Shuffle and pick
    return [...DRILL_REPOSITORY]
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
}
