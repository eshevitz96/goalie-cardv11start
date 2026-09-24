/**
 * Live Coaching Validation & Regression Test Suite
 * Tests Goalie Card Offline Fallback, Negation Detection, Draft Action Cards, and Provenance.
 */

import { hasExplicitNegation, detectExplicitAction } from '../lib/goalieCardChat';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("RUNNING GOALIE CARD OFFLINE FALLBACK REGRESSION TESTS");
console.log("=================================================\n");

// Test 1: Today's Exact Message and Date (2026-09-24)
const todayDateStr = "2026-09-24";
const exactUserMessage = "trained a lacrosse goalie this morning, not a workout for me. body is a little sore, nothing crazt";

console.log(`[Test 1] Today's Exact Message (${todayDateStr}): "${exactUserMessage}"`);
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
assert(actionResult3?.actionCard?.type === 'training_session', "Action card type must be training_session");
assert(actionResult3?.actionCard?.data?.duration === 38, "Duration must equal 38m");
assert(actionResult3?.mode === 'DETERMINISTIC_ACTION', "Mode must be DETERMINISTIC_ACTION");
assert(!actionResult3?.replyText?.toLowerCase().startsWith("logged your"), "Reply must NEVER claim 'Logged your...' before persistence");
assert(actionResult3?.replyText?.includes("drafted") === true, "Reply must clearly state 'drafted'");
assert(!actionResult3?.replyText?.includes("Friday's game"), "Reply must NOT include hardcoded 'Friday's game'");
assert(!actionResult3?.replyText?.includes("Tomorrow let's keep it"), "Reply must NOT include hardcoded temporal coaching directives");

// Test 4: Explicit Calendar Scheduling (Draft Framing Contract)
console.log("\n[Test 4] Explicit Calendar Scheduling");
const calendarMsg = "I have a stick 'n puck on Thursday at 2pm. Can you put that on my calendar?";
const actionResult4 = detectExplicitAction(calendarMsg, todayDateStr);

assert(actionResult4 !== null, "Action card result must exist for calendar request");
assert(actionResult4?.actionCard?.type === 'calendar_event', "Action card type must be calendar_event");
assert(actionResult4?.mode === 'DETERMINISTIC_ACTION', "Mode must be DETERMINISTIC_ACTION");
assert(actionResult4?.replyText?.includes("prepared a draft calendar event") === true, "Reply must use draft framing");

console.log("\n=================================================");
console.log("ALL REGRESSION TESTS PASSED CLEANLY!");
console.log("=================================================");
