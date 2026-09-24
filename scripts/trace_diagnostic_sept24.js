const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateDeterministicUuid(namespace, sourceId) {
  const hash = crypto.createHash('sha1').update(`${namespace}:${sourceId}`).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

const { ATHLETE_TRAINING_HISTORY, ATHLETE_PROFILE_METRICS } = require('../lib/athleteTrainingHistory.ts');
const localJsonPath = path.join(process.cwd(), 'data', 'athlete-track-local.json');
const dynamicRecords = JSON.parse(fs.readFileSync(localJsonPath, 'utf-8'));

function getHistoricalBaseline() {
  return ATHLETE_TRAINING_HISTORY.map(entry => {
    const stableId = generateDeterministicUuid('athlete_track_historical', entry.id);
    let epistemicType = 'COMPLETED_TRAINING';
    if (entry.type === 'baseline') {
      epistemicType = 'BASELINE_EVALUATION';
    } else if (entry.type === 'travel' || entry.id === 'ath-2026-09-14-lawnmow') {
      epistemicType = 'UNSTRUCTURED_ACTIVITY';
    }

    return {
      id: stableId,
      userId: '00000000-0000-0000-0000-000000000000',
      date: entry.date,
      time: entry.time,
      title: entry.title,
      epistemicType,
      trainingType: entry.type,
      durationMins: null,
      confidence: entry.confidence || 'EXACT',
      phase: entry.phase,
      location: entry.location,
      warmup: entry.warmup,
      strength: entry.strength,
      athletic: entry.athletic,
      balance: entry.balance,
      core: entry.core,
      conditioning: entry.conditioning,
      recovery: entry.recovery,
      notes: entry.notes,
      athleteReflection: entry.athleteReflection,
      coachNotes: entry.coachNotes,
      cues: entry.cues,
      rawAthleteReport: entry.athleteReflection || entry.notes,
      supersedesId: null,
      supersededBy: null,
      isActive: true,
      createdAt: `${entry.date}T12:00:00.000Z`
    };
  });
}

function getUnifiedTimeline() {
  const historical = getHistoricalBaseline();
  const recordMap = new Map();

  historical.forEach(h => recordMap.set(h.id, h));
  dynamicRecords.forEach(d => recordMap.set(d.id, d));

  Array.from(recordMap.values()).forEach(rec => {
    if (rec.supersedesId && recordMap.has(rec.supersedesId)) {
      const superseded = recordMap.get(rec.supersedesId);
      superseded.isActive = false;
      superseded.supersededBy = rec.id;
    }
  });

  const allEntries = Array.from(recordMap.values()).filter(e => e.isActive);
  return allEntries.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });
}

function getFreshness(targetDate) {
  const timeline = getUnifiedTimeline();

  let completedTrainingThrough = null;
  let athleteStateThrough = null;
  let activityContextThrough = null;

  let nextPerf = {
    eventDate: null,
    eventType: null,
    eventName: null,
    daysRemaining: null,
    source: 'NONE'
  };

  for (const entry of timeline) {
    if (entry.epistemicType === 'PLANNED_EVENT') {
      const refDate = targetDate || new Date().toISOString().slice(0, 10);
      if (!nextPerf.eventDate && entry.date >= refDate) {
        const today = new Date(refDate);
        const evtDate = new Date(entry.date);
        const diffDays = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        nextPerf = {
          eventDate: entry.date,
          eventType: entry.trainingType || 'on_ice',
          eventName: entry.title,
          daysRemaining: Math.max(0, diffDays),
          source: 'LOCAL_STORE'
        };
      }
      continue;
    }

    if (targetDate && entry.date > targetDate) continue;

    if (entry.epistemicType === 'COMPLETED_TRAINING') {
      if (!completedTrainingThrough || entry.date > completedTrainingThrough) {
        completedTrainingThrough = entry.date;
      }
    }

    if (entry.epistemicType === 'ATHLETE_STATE' || entry.athleteReflection || (entry.notes && entry.notes.toLowerCase().includes('sore'))) {
      if (!athleteStateThrough || entry.date > athleteStateThrough) {
        athleteStateThrough = entry.date;
      }
    }

    if (entry.epistemicType !== 'PLANNED_EVENT') {
      if (!activityContextThrough || entry.date > activityContextThrough) {
        activityContextThrough = entry.date;
      }
    }
  }

  return {
    completedTrainingThrough,
    athleteStateThrough,
    activityContextThrough,
    nextPerformance: nextPerf
  };
}

function getDecisionContext(targetDate) {
  const timeline = getUnifiedTimeline();
  const freshness = getFreshness(targetDate);

  const recentCompletedSessions = timeline
    .filter(e => e.epistemicType === 'COMPLETED_TRAINING')
    .slice(-8);

  const recentAthleteStates = timeline
    .filter(e => e.epistemicType === 'ATHLETE_STATE' || Boolean(e.athleteReflection))
    .slice(-6);

  const recentActivities = timeline
    .filter(e => e.epistemicType === 'UNSTRUCTURED_ACTIVITY')
    .slice(-4);

  return {
    athleteProfile: ATHLETE_PROFILE_METRICS,
    freshness,
    recentCompletedSessions,
    recentAthleteStates,
    recentActivities,
    upcomingEvents: freshness.nextPerformance.eventDate ? [freshness.nextPerformance] : [],
    unifiedTimeline: timeline
  };
}

function formatDecisionContextForPrompt(ctx) {
  const f = ctx.freshness;
  
  const freshnessLines = [
    `=== ATHLETE TRACK FRESHNESS STATE ===`,
    `- completedTrainingThrough: ${f.completedTrainingThrough || 'None (Unknown)'}`,
    `- athleteStateThrough:      ${f.athleteStateThrough || 'None (Unknown)'}`,
    `- activityContextThrough:  ${f.activityContextThrough || 'None (Unknown)'}`,
    `- nextPerformance:          ${f.nextPerformance.eventDate ? `${f.nextPerformance.eventDate} | "${f.nextPerformance.eventName}" (Type: ${f.nextPerformance.eventType}, in ${f.nextPerformance.daysRemaining} days, Source: ${f.nextPerformance.source})` : 'None scheduled'}`
  ];

  const timelineEntries = ctx.unifiedTimeline
    .filter(e => e.epistemicType !== 'PLANNED_EVENT')
    .slice(-10);

  const timelineLines = [
    `=== ACTIVE UNIFIED ATHLETE TRACK TIMELINE (RECENT SESSIONS & ACTIVITIES) ===`,
    ...timelineEntries.map(e => {
      const parts = [
        `[${e.date}]`,
        `[${e.epistemicType}]`,
        `"${e.title}" (${e.trainingType || 'general'})`,
        `Duration: ${e.durationMins !== null && e.durationMins !== undefined ? `${e.durationMins}m` : 'UNKNOWN/NULL (DO NOT INFER)'}`
      ];
      if (e.warmup) parts.push(`Warmup: ${e.warmup}`);
      if (e.strength && e.strength.length) parts.push(`Strength: ${e.strength.join('; ')}`);
      if (e.conditioning) parts.push(`Conditioning: ${e.conditioning}`);
      if (e.recovery && e.recovery.length) parts.push(`Recovery: ${e.recovery.join('; ')}`);
      if (e.cues && e.cues.length) parts.push(`Cues: ${e.cues.join(', ')}`);
      if (e.notes) parts.push(`Notes: ${e.notes}`);
      if (e.athleteReflection) parts.push(`Athlete Reflection: "${e.athleteReflection}"`);
      if (e.rawAthleteReport && e.rawAthleteReport !== e.athleteReflection) parts.push(`Raw Report: "${e.rawAthleteReport}"`);
      return `- ` + parts.join(' | ');
    })
  ];

  const activityLines = [
    `=== UNSTRUCTURED & NON-WORKOUT ACTIVITY CONTEXT (Activity load only, NOT personal completed workouts) ===`,
    ctx.recentActivities.length > 0
      ? ctx.recentActivities.map(a => `- [${a.date}] "${a.title}": ${a.notes || a.rawAthleteReport || 'Unstructured activity'}`).join('\n')
      : '- None recorded.'
  ];

  const stateLines = [
    `=== SUBJECTIVE ATHLETE STATES & TISSUE READINESS ===`,
    ctx.recentAthleteStates.length > 0
      ? ctx.recentAthleteStates.map(s => `- [${s.date}] "${s.title}": ${s.athleteReflection || s.notes || s.rawAthleteReport}`).join('\n')
      : '- No subjective reports recorded.'
  ];

  const lookaheadEvents = ctx.unifiedTimeline.filter(e => e.epistemicType === 'PLANNED_EVENT');
  const lookaheadLines = [
    `=== UPCOMING SCHEDULE & PLANNED PERFORMANCE (PLANNED ONLY — NOT COMPLETED WORKLOAD) ===`,
    lookaheadEvents.length > 0
      ? lookaheadEvents.map(e => `- [${e.date}] [PLANNED_EVENT] "${e.title}" (Type: ${e.trainingType || 'sport'}, Status: PLANNED)`).join('\n')
      : (f.nextPerformance.eventDate ? `- [${f.nextPerformance.eventDate}] [PLANNED_EVENT] "${f.nextPerformance.eventName}" (Type: ${f.nextPerformance.eventType}, Days Remaining: ${f.nextPerformance.daysRemaining})` : '- No upcoming scheduled events.')
  ];

  return [
    freshnessLines.join('\n'),
    timelineLines.join('\n'),
    activityLines.join('\n'),
    stateLines.join('\n'),
    lookaheadLines.join('\n')
  ].join('\n\n');
}

const targetDate = '2026-09-24';
const ctx = getDecisionContext(targetDate);
const formattedTrack = formatDecisionContextForPrompt(ctx);

const route = fs.readFileSync('./app/api/goalie-card/chat/route.ts', 'utf8');
const basePromptMatch = route.match(/const BASE_GOALIE_SYSTEM_PROMPT = `([\s\S]*?)`;/);
const basePrompt = basePromptMatch ? basePromptMatch[1] : '';

const userMessage = 'What should I do for training today? I have stick & puck tomorrow.';
const dynamicFullPrompt = `${basePrompt}

${formattedTrack}

CROSS-THREAD LONG-TERM MEMORY (PAST TOPICS & DISCUSSIONS ACROSS SESSIONS):
No previous thread memories.

CURRENT CONVERSATION HISTORY (ACTIVE THREAD):
Starting a new conversation in this thread.

CURRENT THREAD INFO:
- Title: Chat • 2026-09-24
- Date: 2026-09-24
`;

const fullPayloadText = `${dynamicFullPrompt}\n\nElliott's Latest Message: "${userMessage}"\n\nRespond naturally as his coach in required JSON format with "reply", "actionCard" (null or training_session/calendar_event), and "suggestedThreadTitle". Remember: When proposing a training card, state that you've drafted the card for review. Never claim it is already logged to the database.`;

console.log('=== RUNTIME PROMPT TRACE DIAGNOSTIC ===');
console.log('Full Prompt Length (chars):', fullPayloadText.length);
console.log('\n--- EXACT OCCURRENCE ANALYSIS ---');

const terms = ['hip', 'hips', 'adductor', 'groin', 'mobility', 'recovery', 'strength', 'tomorrow', 'stick & puck'];
terms.forEach(t => {
  // Case-insensitive whole word / substring search
  const regex = new RegExp(`\\b${t}\\b`, 'gi');
  const matches = [...fullPayloadText.matchAll(regex)];
  console.log(`\nTERM: "${t}" -> Total Exact Occurrences: ${matches.length}`);
  matches.forEach((m, i) => {
    const start = Math.max(0, m.index - 50);
    const end = Math.min(fullPayloadText.length, m.index + t.length + 50);
    const snippet = fullPayloadText.substring(start, end).replace(/\n/g, ' ');
    console.log(`  [${i+1}] (idx: ${m.index}) "...${snippet}..."`);
  });
});

console.log('\n--- SEARCH FOR "low-angle releases" ---');
const lowAngleMatches = [...fullPayloadText.matchAll(/low-angle releases/gi)];
console.log(`"low-angle releases" matches: ${lowAngleMatches.length}`);
lowAngleMatches.forEach(m => {
  const start = Math.max(0, m.index - 50);
  const end = Math.min(fullPayloadText.length, m.index + 50);
  console.log(`  -> "...${fullPayloadText.substring(start, end).replace(/\n/g, ' ')}..."`);
});

console.log('\n--- SEARCH FOR DURATION 45 ---');
const duration45Matches = [...fullPayloadText.matchAll(/45/gi)];
console.log(`"45" occurrences: ${duration45Matches.length}`);
duration45Matches.forEach(m => {
  const start = Math.max(0, m.index - 50);
  const end = Math.min(fullPayloadText.length, m.index + 50);
  console.log(`  -> "...${fullPayloadText.substring(start, end).replace(/\n/g, ' ')}..."`);
});
