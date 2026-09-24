import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { ATHLETE_PROFILE_METRICS, ATHLETE_TRAINING_HISTORY, LEARNED_PATTERNS } from '@/lib/athleteTrainingHistory';
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

const formatAthleteHistorySummary = () => {
    const recent = ATHLETE_TRAINING_HISTORY.slice(-8);
    return recent.map(r => `- [${r.date}] ${r.title} (${r.type}): ${r.notes || ''} ${r.cues ? `Cues: ${r.cues.join(', ')}` : ''}`).join('\n');
};

const GOALIE_SYSTEM_PROMPT = `
You are GOALIE CARD — the elite personal coaching engine and training intelligence partner for professional goaltender Elliott Shevitz.

ATHLETE DOSSIER & COMPREHENSIVE TRAINING HISTORY:
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
  * Workload Accounting: When Elliott coaches multiple lacrosse lessons on the field (throwing, demoing stance, standing on turf), recognize this as real physical demand on feet, lower back, and shoulders, and factor it into his daily recovery planning.
- Recent Training History Log:
${formatAthleteHistorySummary()}

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
   - Provide conservative athletic load adjustments (e.g. decompressing hip capsule, adductor flush, avoiding heavy axial loading).

NATURAL COACHING DIALOGUE & INTELLIGENCE MANDATE:
1. PURE NATURAL LANGUAGE:
   - Talk to Elliott naturally, directly, and conversationally, exactly like a high-level private goalie coach.
   - DO NOT use rigid, formulaic section headers like "### WHERE TO GO NEXT" or "### WHERE NOT TO GO".
   - DO NOT write robotic, repetitive essays. Weave guidance, focus areas, and movement boundaries naturally into your sentences.
2. SHORT & ADAPTIVE RESPONSES:
   - If Elliott sends a short check-in, greeting, or number (e.g. "how are we", "3" for groin tightness, "done with skate"), reply in 1–3 natural, punchy sentences.
3. LONG-TERM MEMORY & CONVERSATIONAL CONTINUITY:
   - Remember previous conversations, past soreness reports, and upcoming games. If he discussed his adductors yesterday or an upcoming match on Friday, maintain that contextual continuity across threads.

ACTION CARDS MANDATE:
- Set "actionCard": null for casual greetings, status checks, or general questions.
- Set "actionCard" ONLY in these two explicit scenarios:
  1. Training Workout discussed or completed (including running/cardio, HIIT, yoga/mobility, on-ice skate, gym/lifting, lacrosse coaching):
     - CRITICAL: If Elliott mentions multiple workouts (e.g., "I ran 3 miles and did yoga flow"), combine them into the title and routine breakdown (e.g., "3-Mile Run & Yoga Recovery Flow"). Never miss a mentioned run, skate, or lift!
     {
       "type": "training_session",
       "title": "Clean Combined Title (e.g. 3-Mile Run & Yoga Recovery Flow or 38-min Deck of Cards HIIT)",
       "data": {
         "title": "Clean Session Title",
         "type": "strength" | "conditioning" | "sport" | "recovery" | "other",
         "duration": 45,
         "date": "YYYY-MM-DD",
         "details": "Routine breakdown of everything completed (e.g. 3-mile run + 30m yoga & hip flow)",
         "recoveryNotes": "Tissue readiness or fatigue notes"
       }
     }
  2. Calendar Event discussed (e.g. "I have a stick 'n puck on Thursday at 2pm", "Game on Friday at 7pm", "meeting with trainer tomorrow"):
     {
       "type": "calendar_event",
       "title": "Event Title (e.g. On-Ice Stick 'n Puck)",
       "data": {
         "title": "On-Ice Stick 'n Puck",
         "date": "YYYY-MM-DD",
         "time": "2:00 PM",
         "location": "Local Rink",
         "sport": "Hockey",
         "details": "Edge priming and low-angle tracking"
       }
     }

OUTPUT FORMAT:
Always return valid JSON:
{
  "reply": "Natural conversational coaching response (concise, direct, coach tone, zero rigid template headers)",
  "actionCard": null OR {
    "type": "training_session" | "calendar_event",
    "title": "Short Title",
    "data": { ... }
  },
  "suggestedThreadTitle": "Short 3-5 word title for this conversation thread if new (e.g. Adductor Flush & Friday Prep)"
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

        // 3. Synthesize Cross-Thread Long-Term Memory & Ingest Live Database Records
        let crossThreadMemory = "No previous thread memories.";
        let liveDatabaseSessionsSummary = "No manual training sessions recorded in database yet.";
        let liveWellnessSummary = "No active soreness reported.";
        let liveUpcomingSchedule = "No upcoming events scheduled.";
        let lookaheadSource = "None (No Scheduled Events)";
        const historyThroughDate = ATHLETE_PROFILE_METRICS.historyThrough || "2026-09-16";

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

            // B. Fetch recent training_sessions
            let sessionQuery = supabaseAdmin
                .from('training_sessions')
                .select('*')
                .order('session_date', { ascending: false })
                .limit(15);

            if (resolvedPublicId && resolvedAuthId) {
                sessionQuery = sessionQuery.or(`user_id.eq.${resolvedPublicId},user_id.eq.${resolvedAuthId}`);
            } else if (effectiveUserId) {
                sessionQuery = sessionQuery.eq('user_id', effectiveUserId);
            }

            const { data: dbSessions } = await sessionQuery;
            if (dbSessions && dbSessions.length > 0) {
                liveDatabaseSessionsSummary = dbSessions.map((s: any) => 
                    `- [Date: ${s.session_date}] ${s.title} (Type: ${s.training_type}, Duration: ${s.duration_minutes} min): ${s.notes_summary ? s.notes_summary.replace(/\n+/g, ' | ') : 'Completed'}`
                ).join('\n');
            }

            // C. Fetch recent reflections & wellness
            let refQuery = supabaseAdmin
                .from('reflections')
                .select('*')
                .neq('activity_type', 'goalie_card_chat')
                .order('created_at', { ascending: false })
                .limit(6);

            if (effectiveUserId) {
                refQuery = refQuery.or(`user_id.eq.${effectiveUserId},author_id.eq.${effectiveUserId}`);
            }

            const { data: dbReflections } = await refQuery;
            if (dbReflections && dbReflections.length > 0) {
                liveWellnessSummary = dbReflections.map((r: any) => 
                    `- [${new Date(r.created_at).toLocaleDateString()}] Soreness: ${r.soreness || 'None'}, Notes: ${r.content || r.takeaways || ''}`
                ).join('\n');
            }

            // D. Fetch upcoming events
            const { data: dbEvents } = await supabaseAdmin
                .from('events')
                .select('*')
                .gte('date', todayStr)
                .order('date', { ascending: true })
                .limit(6);

            if (dbEvents && dbEvents.length > 0) {
                lookaheadSource = "Live Events DB";
                liveUpcomingSchedule = dbEvents.map((e: any) => 
                    `- [${e.date}] ${e.name} (${e.sport || 'Event'}${e.scouting_report ? ` - ${e.scouting_report}` : ''})`
                ).join('\n');
            }
        } catch (dbErr) {
            console.warn("[Live Context Query Fallback]:", dbErr);
        }

        // 4. Build Active Thread Conversation History
        const formattedHistory = Array.isArray(messages) && messages.length > 0
            ? messages.slice(-10).map((m: any) => `${m.sender === 'goalie_card' ? 'Goalie Card (Coach)' : 'Elliott'}: ${m.text}`).join('\n')
            : '';

        const dynamicFullPrompt = `
${GOALIE_SYSTEM_PROMPT}

LIVE DATABASE SESSIONS:
${liveDatabaseSessionsSummary}

LATEST WELLNESS & SORENESS LOGS:
${liveWellnessSummary}

UPCOMING SCHEDULE & COMPETITION:
${liveUpcomingSchedule}

CROSS-THREAD LONG-TERM MEMORY (PAST TOPICS & DISCUSSIONS ACROSS SESSIONS):
${crossThreadMemory}

CURRENT CONVERSATION HISTORY (ACTIVE THREAD):
${formattedHistory ? formattedHistory : 'Starting a new conversation in this thread.'}

CURRENT THREAD INFO:
- Title: ${activeThreadTitle}
- Date: ${activeThreadDate}
`;

        let replyText = "";
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
                            { role: 'user', parts: [{ text: `${dynamicFullPrompt}\n\nElliott's Latest Message: "${userMessage}"\n\nRespond naturally as his coach in required JSON format with "reply", "actionCard" (null or training_session/calendar_event), and "suggestedThreadTitle". Remember: When proposing a training card, state that you've drafted the card for review. Never claim it is already logged to the database.` }] }
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
                        replyText = parsed.reply;
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
                        replyText = parsed.reply;
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
            historyThroughDate,
            lookaheadSource,
            details: provenanceMode === 'AI_COACH' 
                ? 'Generated via Multimodal AI Coach Model' 
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
                        provenance
                    },
                    actionCard: actionCard || null
                }),
                created_at: new Date().toISOString()
            });
        }

        return NextResponse.json({
            reply: replyText,
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
