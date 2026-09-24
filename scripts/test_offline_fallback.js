/**
 * Live Coaching Validation & Regression Test Suite (JavaScript)
 * Tests Goalie Card Offline Fallback, Negation Detection, Draft Action Cards, and Provenance.
 */

function hasExplicitNegation(text) {
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

function detectExplicitAction(text, todayStr) {
    const lower = text.toLowerCase();
    
    if (hasExplicitNegation(text)) {
        return null;
    }

    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('put that on my calendar') || lower.includes('add to calendar')) {
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

    const isExplicitLogCommand = lower.startsWith('logged:') || lower.startsWith('completed:') || lower.startsWith('log:');
    const isSpecificWorkoutTemplate = lower.includes('deck of cards') || lower.includes('hiit workout') || lower.includes('5k run') || lower.includes('intervals run');

    if (isExplicitLogCommand || isSpecificWorkoutTemplate) {
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

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("RUNNING GOALIE CARD OFFLINE FALLBACK REGRESSION TESTS");
console.log("=================================================\n");

// Test 1: Today's Exact Message and Date (2026-09-24)
const todayDateStr = "2026-09-24";
const exactUserMessage = "trained a lacrosse goalie this morning, not a workout for me. body is a little sore, nothing crazt";

console.log(`[Test 1] Today's Exact Message (${todayDateStr}):\n"${exactUserMessage}"`);
const isNegated1 = hasExplicitNegation(exactUserMessage);
assert(isNegated1 === true, "Explicit negation 'not a workout for me' MUST be detected");

const actionResult1 = detectExplicitAction(exactUserMessage, todayDateStr);
assert(actionResult1 === null, "No training or calendar actionCard should be generated for negated coaching activity");

// Test 2: Additional Negation Variations
console.log("\n[Test 2] Additional Negation Variations");
const negationTestCases = [
    "didn't train today, just rested",
    "did not lift this morning",
    "skipped workout today due to travel",
    "off day today for recovery",
    "took the day off, adductor is tight",
    "just coaching today on the field, no workout",
    "not a session for me, just ran drills for test goalies",
    "no lifting today"
];

negationTestCases.forEach(msg => {
    assert(hasExplicitNegation(msg) === true, `Negation detected for: "${msg}"`);
    assert(detectExplicitAction(msg, todayDateStr) === null, `No action card for: "${msg}"`);
});

// Test 3: Explicit Training Log (Draft Framing Contract & No "Logged" claims)
console.log("\n[Test 3] Explicit Training Logs (Draft actionCard generation & Draft wording)");
const explicitLogMsg = "Logged: 38-min Deck of Cards HIIT workout today (burpees, push-ups, squats, planks)";
const actionResult3 = detectExplicitAction(explicitLogMsg, todayDateStr);

assert(actionResult3 !== null, "Action card result must exist for explicit log");
assert(actionResult3.actionCard.type === 'training_session', "Action card type must be training_session");
assert(actionResult3.actionCard.data.duration === 38, "Duration must equal 38m");
assert(actionResult3.mode === 'DETERMINISTIC_ACTION', "Mode must be DETERMINISTIC_ACTION");
assert(!actionResult3.replyText.toLowerCase().startsWith("logged your"), "Reply must NEVER claim 'Logged your...' before persistence");
assert(actionResult3.replyText.includes("drafted") === true, "Reply must clearly state 'drafted'");
assert(!actionResult3.replyText.includes("Friday's game"), "Reply must NOT include hardcoded 'Friday's game'");
assert(!actionResult3.replyText.includes("Tomorrow let's keep it"), "Reply must NOT include hardcoded temporal coaching directives");

// Test 4: Explicit Calendar Scheduling (Draft Framing Contract)
console.log("\n[Test 4] Explicit Calendar Scheduling");
const calendarMsg = "I have a stick 'n puck on Thursday at 2pm. Can you put that on my calendar?";
const actionResult4 = detectExplicitAction(calendarMsg, todayDateStr);

assert(actionResult4 !== null, "Action card result must exist for calendar request");
assert(actionResult4.actionCard.type === 'calendar_event', "Action card type must be calendar_event");
assert(actionResult4.mode === 'DETERMINISTIC_ACTION', "Mode must be DETERMINISTIC_ACTION");
assert(actionResult4.replyText.includes("prepared a draft calendar event") === true, "Reply must use draft framing");

console.log("\n=================================================");
console.log("ALL REGRESSION TESTS PASSED CLEANLY (100%)");
console.log("=================================================");
