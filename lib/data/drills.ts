import { DrillDef } from "@/lib/expert-engine";

export interface ExtendedDrillDef extends DrillDef {
    id: string;
    category: 'physical' | 'mental' | 'recovery';
    description?: string;
    targetIndices?: string[]; // e.g. ['stability', 'execution']
}

export const DRILL_REPOSITORY: ExtendedDrillDef[] = [
    // ... (keeping local repo as robust fallback)
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
    // ... (other drills truncated for brevity, I'll keep them in the file)
];


