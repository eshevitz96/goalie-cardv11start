export type ResponseMode = 'conversation' | 'mission';

export interface MissionExerciseItem {
    name: string;
    sets?: string | number | null;
    reps?: string | number | null;
    load?: string | null;
    duration?: string | number | null;
    notes?: string | null;
}

export interface StructuredMissionPrescription {
    what: string;
    why: string;
    plan: MissionExerciseItem[];
    guardrail: string;
}

export interface GoalieCardChatResponse {
    responseMode?: ResponseMode;
    reply: string;
    mission?: StructuredMissionPrescription | null;
    decisionFactors?: string[];
    actionCard?: ActionCardData | null;
    suggestedThreadTitle?: string;
    provenance?: ExecutionProvenance;
}

export type ExecutionProvenanceMode = 'AI_COACH' | 'DETERMINISTIC_ACTION' | 'OFFLINE_UNAVAILABLE';

export type ProvenanceReasonCode = 
    | 'AUTH_UNAVAILABLE' 
    | 'ATHLETE_CONTEXT_UNAVAILABLE' 
    | 'DATABASE_UNAVAILABLE' 
    | 'AI_PROVIDER_UNAVAILABLE' 
    | 'AI_RESPONSE_INVALID' 
    | 'INTERNAL_ERROR';

export interface ExecutionProvenance {
    mode: ExecutionProvenanceMode;
    reasonCode?: ProvenanceReasonCode;
    historyThroughDate: string;
    completedTrainingThrough?: string | null;
    athleteStateThrough?: string | null;
    activityContextThrough?: string | null;
    nextPerformance?: any;
    lookaheadSource: string;
    details?: string;
}

export interface ActionCardData {
    type: 'training_session' | 'calendar_event';
    title: string;
    data: any;
}

export function hasExplicitNegation(text: string): boolean {
    const lower = text.toLowerCase();
    const negationPatterns = [
        /\b(not|wasn't|was not|isn't|is not)\s+(a\s+)?(workout|training|session|lift|run|skate)/i,
        /\b(didn't|did not|didnt)\s+(work\s*out|train|lift|run|skate|do\s+anything)/i,
        /\b(no\s+workout|no\s+training|no\s+lifting|no\s+running|no\s+skating)/i,
        /\b(skipped|skipping)\s+(workout|training|session|gym|lift|run|skate)?/i,
        /\b(off\s*day|rest\s*day|took\s+(the\s+day|today)\s+off)/i,
        /\bjust\s+coaching\b|\bcoaching\s+only\b|\bnot\s+for\s+me\b/i
    ];
    return negationPatterns.some(pattern => pattern.test(lower));
}

export function isQuestionOrInquiry(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower.includes('?')) return true;
    const inquiryPatterns = [
        /\b(is|are|was|were|did|do|does|can|could|should|would|will)\s+(my|the|this|that|it|our|latest|session|workout|skate)\b/i,
        /\b(how\s+many|what\s+did|when\s+was|where\s+is|show\s+me|tell\s+me|check|view|see)\b/i,
        /\b(visible|recorded|saved|tracked|logged\s+yet|in\s+the\s+database)\b/i
    ];
    return inquiryPatterns.some(pattern => pattern.test(lower));
}

export function detectExplicitAction(text: string, todayStr: string): { 
    actionCard?: ActionCardData;
    replyText?: string;
    mode: ExecutionProvenanceMode;
} | null {
    const lower = text.toLowerCase().trim();
    
    // If user explicitly stated this was NOT a workout / skipped / took off
    if (hasExplicitNegation(text)) {
        return null;
    }

    // Questions, inquiries, or reading past sessions must NEVER return an actionCard
    if (isQuestionOrInquiry(text)) {
        return null;
    }

    // Explicit Calendar Event Request (e.g. "schedule a skate on thursday at 2pm", "add stick 'n puck to calendar")
    if (
        (lower.startsWith('schedule') || lower.startsWith('add to calendar') || lower.startsWith('book') || lower.includes('put on my calendar')) &&
        (lower.includes('skate') || lower.includes('puck') || lower.includes('ice') || lower.includes('gym') || lower.includes('lift'))
    ) {
        let eventTitle = "On-Ice Session";
        let time = "10:00 AM";
        let location = "Local Rink";
        let sport = "Hockey";

        if (lower.includes('stick') || lower.includes('skate')) {
            eventTitle = "Stick 'n Puck";
            time = "2:00 PM";
        } else if (lower.includes('lift') || lower.includes('gym')) {
            eventTitle = "Strength & Conditioning";
            time = "9:00 AM";
            location = "Gym";
        }

        return {
            replyText: `I have prepared a draft calendar event for ${eventTitle}. Review the details below and tap "+ Add to Calendar" to confirm and add it to your schedule.`,
            actionCard: {
                type: 'calendar_event',
                title: eventTitle,
                data: {
                    title: eventTitle,
                    date: todayStr,
                    time: time,
                    location: location,
                    sport: sport,
                    details: 'Drafted from Goalie Card request'
                }
            },
            mode: 'DETERMINISTIC_ACTION'
        };
    }

    // Explicit Training Log Request (ONLY explicit commands like "log:", "logged:", "record:")
    const isExplicitLogCommand = lower.startsWith('logged:') || lower.startsWith('completed:') || lower.startsWith('log:') || lower.startsWith('log my') || lower.startsWith('record:');

    if (isExplicitLogCommand) {
        let sessionTitle = "Conditioning & Recovery Session";
        let duration = 40;
        let sessionType = "other";
        let routineDetails = "Custom training session";

        if (lower.includes('run') && lower.includes('yoga')) {
            sessionTitle = "Run & Yoga Recovery Flow";
            duration = 50;
            sessionType = "reaction";
            routineDetails = "Cardio run + hip mobility and yoga flow";
        } else if (lower.includes('run') || lower.includes('5k')) {
            sessionTitle = "Conditioning Run (5K / Intervals)";
            duration = 30;
            sessionType = "footwork";
            routineDetails = "Aerobic conditioning & foot turnover";
        } else if (lower.includes('yoga') || lower.includes('mobility')) {
            sessionTitle = "Yoga & Hip Mobility Recovery Flow";
            duration = 45;
            sessionType = "reaction";
            routineDetails = "Hip capsule flow, adductor release, and yoga stretching";
        } else if (lower.includes('deck of cards') || lower.includes('hiit')) {
            sessionTitle = "38-min Deck of Cards HIIT";
            duration = 38;
            sessionType = "footwork";
            routineDetails = "Hearts: Burpees, Diamonds: Push-ups, Spades: V-ups, Clubs: Squats, Aces: 1m Plank";
        } else if (lower.includes('stick n puck') || lower.includes('stick \'n puck')) {
            sessionTitle = "On-Ice Stick 'n Puck Session";
            duration = 50;
            sessionType = "other";
            routineDetails = "Crease mobility, low-angle tracking, edge control, rebound recoveries";
        }

        return {
            replyText: `I've drafted a training card for ${sessionTitle} (${duration}m). Review the details below and tap "+ Add to Training" to confirm and save it to your athlete record.`,
            actionCard: {
                type: 'training_session',
                title: sessionTitle,
                data: {
                    title: sessionTitle,
                    duration,
                    type: sessionType,
                    date: todayStr,
                    details: routineDetails,
                    recoveryNotes: lower.includes('groin') ? "Adductor tightness noted." : "Session completed cleanly."
                }
            },
            mode: 'DETERMINISTIC_ACTION'
        };
    }

    return null;
}
