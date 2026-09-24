import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { ATHLETE_PROFILE_METRICS, LEARNED_PATTERNS } from '@/lib/athleteTrainingHistory';
import { 
    AthleteTrackRepository, 
    formatDecisionContextForPrompt, 
    DecisionLoadContext, 
    NextPerformanceLookahead 
} from '@/lib/repositories/athleteTrackRepository';
import { 
    ExecutionProvenanceMode, 
    ExecutionProvenance, 
    hasExplicitNegation, 
    detectExplicitAction 
} from '@/lib/goalieCardChat';

interface ChatMessage {
    id?: string;
    sender: 'goalie' | 'goalie_card';
    text: string;
    timestamp?: string;
    actionCard?: {
        type: 'training_session' | 'calendar_event';
        title: string;
        data: any;
    };
    provenance?: ExecutionProvenance;
}

const BASE_GOALIE_SYSTEM_PROMPT = `
You are GOALIE CARD — the elite personal coaching engine and training intelligence partner for professional goaltender Elliott Shevitz.

ATHLETE DOSSIER & ATHLETIC OBJECTIVES:
- Name: Elliott Shevitz
- Primary Roles: 
  1. Professional Ice Hockey Goaltender (Personal athletic training & competitive contract)
  2. Elite Lacrosse Goalie Coach (Coaching private lessons, clinics, and test goalies)
- Age: 29
- Primary Athletic Objective (Hockey): Master crease depth, hold edges on low-angle releases, zero wasted slide drift, arrive set before release, sequence termination on multi-shot flurries.
- Key Athletic Baselines: 5x5 225lb Bench, 375lb Squat, 55lb/side Smith Front Squat, 70lb RDLs, 65lb x 10 Incline DB Press, 75lb Farmer Carry, 7:36 5k pace.
- Key Hockey Movement Cues:
  * "Keep it simple."
  * "Sit into your edges."
  * "Get low → load the leg → push the floor away → control the landing."
  * "Arrive set."
  * "Angles → depth → arrive set → read → save."
  * "Compact stance → patience → post-shot agility."

LACROSSE GOALIE COACHING EXPERTISE & EXACT TERMINOLOGY:
- You are fully fluent in both Ice Hockey Goaltending AND Lacrosse Goalie mechanics and terminology.
- When Elliott mentions coaching test goalies, private lessons, or lesson takeaways, use his EXACT cues:
  * Core Cues:
    - "Eyes lead hands."
    - "Arc around the ball."
    - "Reverse cradle through the save."
    - "Light hands, loose on all shots."
    - "Step directly to the ball."
  * Shot Levels & Classification (Lacrosse):
    - Primary Levels: **High**, **Hips**, **Low** (e.g. stick-side high, off-stick hip, off-stick low, 5-hole/bounce).
    - Note: "Shoulder" is only a specific placement descriptor of where the ball was located, not a primary level.
  * Strictly Banned Terminology: NEVER use generic AI jargon like "12-yard cylinder". Use Elliott's exact cues above.
  * Workload Accounting: When Elliott coaches lacrosse lessons on the field (throwing, demoing stance, standing on turf), recognize this as real physical demand on feet, lower back, and shoulders, and factor it into his daily recovery planning. However, coaching is NOT his own completed workout.

STRICT PRIVACY & DATA CONFIDENTIALITY (MANDATORY):
- These conversations are strictly private, personal, and confidential to Elliott.
- They are personal coaching discussions and must never be exposed or shared.

STRICT SAFETY & SCOPE BOUNDARIES (CRITICAL):
1. CLINICAL MENTAL HEALTH & PSYCHIATRIC BOUNDARY:
   - Goalie Card is NOT a licensed therapist, counselor, psychiatrist, or crisis resource.
   - If severe depression, self-harm, suicidal ideation, psychiatric crisis, or severe emotional trauma is mentioned:
     * State your operational boundary: you are a sports performance and goaltending intelligence tool.
     * Direct them immediately to a qualified human professional (e.g. licensed sports psychologist, or emergency helpline like the 988 Suicide & Crisis Lifeline).
2. MEDICAL & SEVERE ORTHOPEDIC INJURY BOUNDARY:
   - Do not diagnose acute structural tears (torn ACL/MCL/labrum), concussions, or surgical trauma.
   - For sharp/traumatic pain, advise immediate evaluation by a sports orthopedic physician or PT.
   - Provide conservative athletic load adjustments (e.g. conservative volume reduction, non-axial accessory work, active recovery).

NATURAL COACHING DIALOGUE & INTELLIGENCE MANDATE:
1. CONVERSATIONAL COACHING & NATURAL DIALOGUE:
   - Talk to Elliott naturally, directly, and conversationally, like a high-level private goalie coach.
   - Preserve natural coaching language, continuity, personality, and context. Concision must never become robotic.
   - For check-ins, reflections, questions, disagreements, technical discussions, readiness reports, in-session updates, athlete decisions, and follow-up inquiries, set responseMode to "conversation" and respond naturally and contextually. Do NOT force ordinary conversational exchanges into a workout template.
   - The athlete must be free to:
     * Challenge a recommendation or ask "why?"
     * Report that something feels easier or harder
     * Report soreness, fatigue, or readiness shifts
     * Disagree with the coach or change plans
     * Discuss an on-ice performance or technical mechanics
     * Check in naturally without immediately receiving a templated workout card.
   - Goalie Card reasons with Elliott rather than simply emitting cards. When Elliott disagrees or challenges advice, do not automatically capitulate; reconsider thoughtfully using Athlete Track history, current state, Contract priorities, and evidence.

2. DEFAULT TRAINING RECOMMENDATION UX (WHEN PRESCRIBING A MISSION):
   - When Goalie Card is prescribing a workout or daily training plan, set responseMode to "mission" and populate the structured "mission" object using the scan-first information hierarchy (WHAT → WHY → PLAN → GUARDRAIL):
     * WHAT: 1 concise sentence stating today's objective/session and approximate duration.
     * WHY: 1–2 concise sentences explaining decisive factual context (recency, readiness, upcoming event).
     * PLAN: Array of structured exercise items with name, sets, reps, load, duration, and notes.
     * GUARDRAIL: 1 concise line covering RPE reserve, stop/reassess criteria, or performance-preservation constraint.
   - Default Mission responses must remain concise and scan-first—easy to read during a workout. Deeper physiological reasoning belongs in follow-up dialogue or the Explain experience.
   - Mission Revision Boundary: Preserve the invariant "ORIGINAL PLANNED MISSION → MISSION REVISION(S) → ATHLETE DECISION(S) → ACTUAL EXECUTION". If conversational feedback changes the plan, generate the appropriate revision without overwriting the original Mission.

3. PRE-PERFORMANCE & PRE-ICE DECISION SPECTRUM (~1 DAY OUT):
   - When a relevant on-ice performance is ~1 day away, evaluate a spectrum rather than treating the choice as a binary between heavy lifting vs. pure recovery:
     a. Movement Preparation / Active Recovery: Appropriate when current readiness, acute soreness, movement quality, fatigue, or recent workload indicates additional training stress is unlikely to be useful.
     b. Controlled Submaximal / Maintenance Strength: Must remain an active option when context supports it, including when:
        - Current symptoms are mild and not movement-altering,
        - Recent workload has been predominantly conditioning/on-ice rather than strength,
        - Sufficient time has elapsed since meaningful strength exposure,
        - Volume/load can be constrained to preserve readiness for the upcoming performance.
        - Base Heuristic: RPE <= 7 may be used as the current BASE_COACHING_HEURISTIC for this session type, not an immutable rule. Established athlete-specific evidence may supersede it through the existing epistemic architecture.
     c. Full / High-Fatigue Strength: Generally disfavored ~1 day before a priority performance when it creates meaningful risk of residual fatigue. Do not make this an absolute prohibition; evaluate against Contract priorities, importance of upcoming performance, current readiness, and established athlete-specific evidence.
   - This spectrum must NOT become a hard rule that the athlete should lift the day before ice. Evaluate all three options from actual context.

4. SYMPTOM GROUNDING MANDATE:
   - Strictly ground current symptoms in the athlete's current report.
   - If Elliott reports generalized soreness (e.g. "body is a little sore, nothing crazy"), DO NOT silently convert that into current hip, groin, adductor, or other localized soreness merely because those areas exist elsewhere in Athlete Track history.
   - Historical tissue information provides context but must remain clearly distinguishable from current reported state.

5. LONG-TERM MEMORY & CONVERSATIONAL CONTINUITY:
   - Maintain accurate contextual continuity across threads based strictly on the provided Athlete Track intelligence.
   - Unknown values (e.g. unknown duration or load) must remain unknown. Do not invent missing durations, reps, or sets.
   - Do not convert temporary observations into permanent learned patterns.

ACTION CARDS MANDATE:
- Set "actionCard": null for casual greetings, status checks, general questions, or non-workout coaching.
- Explicit Negation Rule: NEVER create a training actionCard if Elliott explicitly states it was "not a workout", "didn't train", "didn't lift", "skipped", or "just coaching".
- Set "actionCard" ONLY in these two explicit scenarios:
  1. Training Workout completed or explicitly discussed for logging (combine multiple workouts into title and details if applicable).
  2. Calendar Event discussed (e.g. scheduled skate or match).

OUTPUT FORMAT & SCHEMA REQUIREMENTS:
Always return valid JSON with this exact schema:
{
  "responseMode": "conversation" | "mission",
  "reply": "<Conversational coaching message: full natural response if responseMode is conversation; or concise introductory/framing message if responseMode is mission>",
  "mission": null OR {
    "what": "<1 concise sentence stating today's focus and estimated total duration>",
    "why": "<1-2 concise sentences summarizing the factual context justifying this session (recency, readiness, upcoming event)>",
    "plan": [
      {
        "name": "<Exercise, drill, or movement name>",
        "sets": "<Target sets count or range, or null>",
        "reps": "<Target reps count, range, or duration, or null>",
        "load": "<Prescribed load or intensity constraint, or null>",
        "duration": "<Estimated duration for this block if applicable, or null>",
        "notes": "<Key technical cue or setup instruction, or null>"
      }
    ],
    "guardrail": "<1 concise line stating safety boundary, RPE ceiling, or stop criterion>"
  },
  "decisionFactors": [
    "<Factual context item from Deterministic Decision Context used to make this decision>"
  ],
  "actionCard": null OR {
    "type": "training_session" | "calendar_event",
    "title": "<Short Title>",
    "data": {
      "title": "<Session or Event Title>",
      "type": "strength" | "conditioning" | "sport" | "recovery" | "other",
      "duration": "<Duration in minutes as number, or null if unmeasured>",
      "date": "YYYY-MM-DD",
      "details": "<Routine breakdown or event details>",
      "recoveryNotes": "<Readiness or recovery notes, or null>"
    }
  },
  "suggestedThreadTitle": "<Short 3-5 word title for this conversation thread if new>"
}
`;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const userEmail = searchParams.get('userEmail');
        const threadsOnly = searchParams.get('threads') === 'true';
        const threadId = searchParams.get('threadId');

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Resolve User ID
        let resolvedUserId: string | null = null;
        let resolvedAuthId: string | null = null;

        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id')
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .maybeSingle();
            if (u) {
                resolvedUserId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        if (!resolvedUserId && userEmail) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id')
                .ilike('email', userEmail.trim())
                .maybeSingle();
            if (u) {
                resolvedUserId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        // Fallback: Default to primary athlete
        if (!resolvedUserId) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id')
                .ilike('email', '%eshevitz96%')
                .maybeSingle();
            if (u) {
                resolvedUserId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        const effectiveUserId = resolvedUserId || resolvedAuthId;
        if (!effectiveUserId) {
            return NextResponse.json({ threads: [], messages: [] });
        }

        // Fetch user's private chat records
        const { data: records, error } = await supabaseAdmin
            .from('reflections')
            .select('*')
            .eq('activity_type', 'goalie_card_chat')
            .or(`author_id.eq.${effectiveUserId},goalie_id.eq.${effectiveUserId},user_id.eq.${effectiveUserId}`)
            .order('created_at', { ascending: true });

        if (error || !records) {
            return NextResponse.json({ threads: [], messages: [] });
        }

        // Group records into threads
        const threadMap = new Map<string, {
            id: string;
            date: string;
            title: string;
            lastMessage: string;
            updatedAt: string;
            messageCount: number;
            messages: ChatMessage[];
        }>();

        records.forEach(r => {
            let metadata: any = {};
            let actionCard = undefined;

            try {
                if (r.injury_details && r.injury_details.startsWith('{')) {
                    const parsed = JSON.parse(r.injury_details);
                    metadata = parsed.metadata || {};
                    actionCard = parsed.actionCard || (parsed.type ? parsed : undefined);
                }
            } catch (e) {}

            const recordDate = r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
            const currentThreadId = metadata.threadId || `thread-${recordDate}`;
            const currentThreadTitle = metadata.threadTitle || r.title || `Chat • ${recordDate}`;

            if (!threadMap.has(currentThreadId)) {
                threadMap.set(currentThreadId, {
                    id: currentThreadId,
                    date: metadata.threadDate || recordDate,
                    title: currentThreadTitle,
                    lastMessage: r.content || '',
                    updatedAt: r.created_at,
                    messageCount: 0,
                    messages: []
                });
            }

            const t = threadMap.get(currentThreadId)!;
            t.lastMessage = r.content || '';
            t.updatedAt = r.created_at;
            t.messageCount += 1;
            t.messages.push({
                id: r.id,
                sender: r.author_role === 'coach' ? 'goalie_card' : 'goalie',
                text: r.content || '',
                timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                actionCard
            });
        });

        const allThreads = Array.from(threadMap.values()).reverse();

        if (threadsOnly) {
            return NextResponse.json({
                threads: allThreads.map(t => ({
                    id: t.id,
                    date: t.date,
                    title: t.title,
                    lastMessage: t.lastMessage,
                    updatedAt: t.updatedAt,
                    messageCount: t.messageCount
                }))
            });
        }

        if (threadId) {
            const selected = threadMap.get(threadId);
            return NextResponse.json({
                thread: selected || null,
                messages: selected ? selected.messages : []
            });
        }

        // Default: return latest thread messages or all recent
        const latestThread = allThreads[0];
        return NextResponse.json({
            threads: allThreads.map(t => ({
                id: t.id,
                date: t.date,
                title: t.title,
                lastMessage: t.lastMessage,
                updatedAt: t.updatedAt,
                messageCount: t.messageCount
            })),
            messages: latestThread ? latestThread.messages : []
        });

    } catch (e: any) {
        return NextResponse.json({ threads: [], messages: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, userMessage, userId, userEmail, threadId, threadTitle, threadDate } = body;

        const supabaseAdmin = getSupabaseAdmin();
        const inputLower = (userMessage || '').toLowerCase();
        const todayStr = new Date().toISOString().slice(0, 10);
        const activeThreadId = threadId || `thread-${todayStr}-${Date.now().toString().slice(-4)}`;
        let activeThreadTitle = threadTitle || `Chat • ${todayStr}`;
        const activeThreadDate = threadDate || todayStr;

        // 1. Resolve User ID and Auth ID
        let resolvedPublicId: string | null = null;
        let resolvedAuthId: string | null = null;

        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        if (!resolvedPublicId && userEmail) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .ilike('email', userEmail.trim())
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        // Fallback: Default to primary athlete
        if (!resolvedPublicId) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .ilike('email', '%eshevitz96%')
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        const effectiveUserId = resolvedPublicId || resolvedAuthId;

        // 2. Persist User Message to Private DB Record
        if (effectiveUserId) {
            await supabaseAdmin.from('reflections').insert({
                user_id: effectiveUserId,
                author_id: effectiveUserId,
                author_role: 'goalie',
                activity_type: 'goalie_card_chat',
                title: activeThreadTitle,
                content: userMessage,
                injury_details: JSON.stringify({
                    metadata: {
                        threadId: activeThreadId,
                        threadTitle: activeThreadTitle,
                        threadDate: activeThreadDate,
                        is_private_chat: true
                    }
                }),
                created_at: new Date().toISOString()
            });
        }

        // 3. Synthesize Cross-Thread Long-Term Memory & Ingest Optional DB Lookahead
        let crossThreadMemory = "No previous thread memories.";
        let liveDbLookahead: NextPerformanceLookahead | undefined = undefined;

        try {
            // A. Fetch recent threads and chat takeaways for cross-session intelligence
            const { data: pastChatRecords } = await supabaseAdmin
                .from('reflections')
                .select('*')
                .eq('activity_type', 'goalie_card_chat')
                .or(`author_id.eq.${effectiveUserId},user_id.eq.${effectiveUserId}`)
                .order('created_at', { ascending: false })
                .limit(25);

            if (pastChatRecords && pastChatRecords.length > 0) {
                const threadSummaries: string[] = [];
                pastChatRecords.forEach(r => {
                    let tTitle = r.title || 'Discussion';
                    let text = r.content || '';
                    if (text.length > 120) text = text.slice(0, 120) + '...';
                    threadSummaries.push(`- [${new Date(r.created_at).toLocaleDateString()}] (${r.author_role === 'coach' ? 'Coach' : 'Elliott'}): ${text}`);
                });
                crossThreadMemory = threadSummaries.slice(0, 10).join('\n');
            }

            // B. Check for upcoming events in live database
            const { data: dbEvents } = await supabaseAdmin
                .from('events')
                .select('*')
                .gte('date', activeThreadDate)
                .order('date', { ascending: true })
                .limit(1);

            if (dbEvents && dbEvents.length > 0) {
                const e = dbEvents[0];
                const today = new Date(activeThreadDate);
                const evtDate = new Date(e.date);
                const diffDays = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                liveDbLookahead = {
                    eventDate: e.date,
                    eventType: (e.sport || 'event').toLowerCase(),
                    eventName: e.name,
                    daysRemaining: Math.max(0, diffDays),
                    source: 'LIVE_DB'
                };
            }
        } catch (dbErr) {
            console.warn("[Live Context Query Warning]:", dbErr);
        }

        // C. Assemble Unified Athlete Track Decision Context
        let decisionContext: DecisionLoadContext;
        try {
            decisionContext = AthleteTrackRepository.getDecisionContext(activeThreadDate, liveDbLookahead);
        } catch (contextError: any) {
            console.error("[AthleteTrackRepository Context Assembly Error]:", contextError);
            return NextResponse.json({
                reply: "Goalie Card is operating in degraded mode. Unified Athlete Track context assembly failed, so live coaching intelligence cannot safely evaluate your workload.",
                actionCard: null,
                provenance: {
                    mode: 'OFFLINE_UNAVAILABLE',
                    historyThroughDate: 'ERROR_DEGRADED',
                    completedTrainingThrough: null,
                    athleteStateThrough: null,
                    activityContextThrough: null,
                    nextPerformance: null,
                    lookaheadSource: 'None (Assembly Failed)',
                    details: 'Context assembly failure: ' + (contextError?.message || 'Unknown error')
                }
            });
        }

        const formattedTrackIntelligence = formatDecisionContextForPrompt(decisionContext);

        // 4. Build Active Thread Conversation History
        const formattedHistory = Array.isArray(messages) && messages.length > 0
            ? messages.slice(-10).map((m: any) => `${m.sender === 'goalie_card' ? 'Goalie Card (Coach)' : 'Elliott'}: ${m.text}`).join('\n')
            : '';

        const dynamicFullPrompt = `
${BASE_GOALIE_SYSTEM_PROMPT}

${formattedTrackIntelligence}

CROSS-THREAD LONG-TERM MEMORY (PAST TOPICS & DISCUSSIONS ACROSS SESSIONS):
${crossThreadMemory}

CURRENT CONVERSATION HISTORY (ACTIVE THREAD):
${formattedHistory ? formattedHistory : 'Starting a new conversation in this thread.'}

CURRENT THREAD INFO:
- Title: ${activeThreadTitle}
- Date: ${activeThreadDate}
`;

        let replyText = "";
        let responseMode: 'conversation' | 'mission' = 'conversation';
        let mission: any = null;
        let decisionFactors: string[] = [];
        let actionCard: ChatMessage['actionCard'] = undefined;
        let suggestedThreadTitle = "";
        let provenanceMode: ExecutionProvenanceMode = 'OFFLINE_UNAVAILABLE';

        // 5. Query Gemini API
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const openAiApiKey = process.env.OPENAI_API_KEY;

        if (geminiApiKey) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${dynamicFullPrompt}\n\nElliott's Latest Message: "${userMessage}"\n\nRespond naturally as his coach in required JSON schema with "responseMode", "reply", "mission" (structured or null), "decisionFactors", "actionCard" (null or training_session/calendar_event), and "suggestedThreadTitle". Remember: When proposing a training card, state that you've drafted the card for review. Never claim it is already logged to the database.` }] }
                        ],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (res.ok) {
                    const geminiData = await res.json();
                    const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawJson) {
                        const parsed = JSON.parse(rawJson);
                        replyText = parsed.reply || "";
                        mission = parsed.mission || null;
                        responseMode = parsed.responseMode || (mission ? 'mission' : 'conversation');
                        decisionFactors = Array.isArray(parsed.decisionFactors) ? parsed.decisionFactors : [];
                        actionCard = parsed.actionCard || undefined;
                        suggestedThreadTitle = parsed.suggestedThreadTitle || "";
                        provenanceMode = 'AI_COACH';
                    }
                }
            } catch (aiErr) {
                console.warn("[Gemini API Fallback]:", aiErr);
            }
        } else if (openAiApiKey) {
            try {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: dynamicFullPrompt },
                            { role: 'user', content: userMessage }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (res.ok) {
                    const openAiData = await res.json();
                    const rawContent = openAiData.choices?.[0]?.message?.content;
                    if (rawContent) {
                        const parsed = JSON.parse(rawContent);
                        replyText = parsed.reply || "";
                        mission = parsed.mission || null;
                        responseMode = parsed.responseMode || (mission ? 'mission' : 'conversation');
                        decisionFactors = Array.isArray(parsed.decisionFactors) ? parsed.decisionFactors : [];
                        actionCard = parsed.actionCard || undefined;
                        suggestedThreadTitle = parsed.suggestedThreadTitle || "";
                        provenanceMode = 'AI_COACH';
                    }
                }
            } catch (openAiErr) {
                console.warn("[OpenAI API Fallback]:", openAiErr);
            }
        }

        // 6. Natural Heuristic Fallback if AI unavailable
        if (!replyText) {
            // Check if user made an explicit deterministic action request
            const explicitResult = detectExplicitAction(userMessage, todayStr);
            
            if (explicitResult) {
                replyText = explicitResult.replyText || "";
                actionCard = explicitResult.actionCard;
                provenanceMode = explicitResult.mode;
            } else {
                provenanceMode = 'OFFLINE_UNAVAILABLE';
                actionCard = undefined;

                if (hasExplicitNegation(userMessage)) {
                    replyText = "Acknowledged: noted that this was coaching/non-workout activity and not a personal training session. [Offline Mode: Live AI coaching intelligence is currently offline, so dynamic directives cannot be generated.]";
                } else if (inputLower.includes('how are we') || inputLower.includes('how are you')) {
                    replyText = "Goalie Card is operating in offline mode. Live AI coaching intelligence is currently unavailable. No automated directive was generated.";
                } else if (inputLower.match(/^\s*[1-5]\s*$/)) {
                    replyText = `Recorded ${inputLower.trim()}/5 check-in rating. [Offline Mode: Live AI coaching intelligence is currently offline, so dynamic load adjustments cannot be calculated.]`;
                } else {
                    replyText = "Goalie Card is operating in offline mode. Live AI coaching intelligence and full Athlete Track context are currently unavailable. No automated coaching directive or training card was inferred.";
                }
            }
        }

        if (suggestedThreadTitle && activeThreadTitle.startsWith('Chat •')) {
            activeThreadTitle = suggestedThreadTitle;
        }

        const provenance: ExecutionProvenance = {
            mode: provenanceMode,
            historyThroughDate: decisionContext.freshness.completedTrainingThrough || '2026-09-16',
            completedTrainingThrough: decisionContext.freshness.completedTrainingThrough,
            athleteStateThrough: decisionContext.freshness.athleteStateThrough,
            activityContextThrough: decisionContext.freshness.activityContextThrough,
            nextPerformance: decisionContext.freshness.nextPerformance,
            lookaheadSource: decisionContext.freshness.nextPerformance?.source || 'LOCAL_STORE',
            details: provenanceMode === 'AI_COACH' 
                ? 'Generated via Multimodal AI Coach Model with Unified Athlete Track Context' 
                : (provenanceMode === 'DETERMINISTIC_ACTION' 
                    ? 'Structured Deterministic Template Action' 
                    : 'Offline Mode (AI Coaching & Live Context Unavailable)')
        };

        // 7. Persist Goalie Card Reply to Private DB Record
        if (effectiveUserId && replyText) {
            await supabaseAdmin.from('reflections').insert({
                user_id: effectiveUserId,
                author_id: effectiveUserId,
                author_role: 'coach',
                activity_type: 'goalie_card_chat',
                title: activeThreadTitle,
                content: replyText,
                injury_details: JSON.stringify({
                    metadata: {
                        threadId: activeThreadId,
                        threadTitle: activeThreadTitle,
                        threadDate: activeThreadDate,
                        is_private_chat: true,
                        responseMode,
                        mission: mission || null,
                        decisionFactors,
                        provenance
                    },
                    actionCard: actionCard || null
                }),
                created_at: new Date().toISOString()
            });
        }

        return NextResponse.json({
            reply: replyText,
            mission,
            responseMode,
            decisionFactors,
            actionCard,
            threadId: activeThreadId,
            threadTitle: activeThreadTitle,
            provenance
        });

    } catch (error: any) {
        console.error("[Goalie Card Chat Error]:", error);
        return NextResponse.json({
            reply: "Goalie Card is operating in offline mode. Live AI coaching intelligence is currently unavailable.",
            actionCard: null,
            provenance: {
                mode: 'OFFLINE_UNAVAILABLE',
                historyThroughDate: ATHLETE_PROFILE_METRICS.historyThrough || '2026-09-16',
                lookaheadSource: 'None (Error Fallback)',
                details: 'Error fallback handler invoked'
            }
        });
    }
}
