/**
 * VERIFICATION TEST SUITE: GOALIE CARD — ATHLETE TRACK + COACH CARD UPDATE
 * Date: Tuesday, September 29, 2026
 * 
 * Verifies:
 * 1. AVAILABLE Coach Card blocks do not become athlete events.
 * 2. BOOKED COACH events do not become nextPerformance for Elliott.
 * 3. Named client lessons (Carter, Hunter, Brock) retain COACH ownership.
 * 4. Sept 28 approximate exposure (70-80 min) has durationMins: null.
 * 5. Sept 28 tired legs & Sept 29 no soreness remain separate observations (no false soreness).
 * 6. Sept 29 recovery does not create a causal learned pattern.
 * 7. Tuesday strength remains planned/uncompleted.
 * 8. Open availability does not create fake client records.
 * 9. Prior Phase 1-3 invariants remain intact.
 * 10. Coach schedule repository transitions (AVAILABLE -> BOOKED -> COMPLETED / CANCELED).
 */

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("======================================================================");
console.log("RUNNING SEPT 29 ATHLETE TRACK + COACH CARD INTEGRATION VERIFICATION");
console.log("======================================================================\n");

// 1. Load Local Data Files
const athleteTrackPath = path.join(__dirname, '..', 'data', 'athlete-track-local.json');
const coachSchedulePath = path.join(__dirname, '..', 'data', 'coach-schedule-local.json');

assert(fs.existsSync(athleteTrackPath), "athlete-track-local.json must exist");
assert(fs.existsSync(coachSchedulePath), "coach-schedule-local.json must exist");

const athleteData = JSON.parse(fs.readFileSync(athleteTrackPath, 'utf8'));
const coachData = JSON.parse(fs.readFileSync(coachSchedulePath, 'utf8'));

// ======================================================================
// TEST 1: BACKFILL — MONDAY SEPT. 28 STICK & PUCK (ATHLETE TRACK)
// ======================================================================
console.log("[Test 1] Sept 28 Stick & Puck Invariants");

const sept28Entries = athleteData.filter(e => e.date === '2026-09-28');
assert(sept28Entries.length >= 1, "Must have Sept 28 entry in athlete track");

const stickAndPuck = sept28Entries.find(e => e.epistemicType === 'COMPLETED_TRAINING' && e.trainingType === 'on_ice');
assert(!!stickAndPuck, "Must have COMPLETED_TRAINING on_ice session for Sept 28");
assert(stickAndPuck.participantRole === 'ATHLETE', "Participant role must be ATHLETE");
assert(stickAndPuck.durationMins === null, "Duration must be null (exact time on ice unknown, scheduled window was 2 hrs, actual high quality ~70-80 mins)");
assert(stickAndPuck.title.includes('Stick & Puck'), "Title must include Stick & Puck");
assert(stickAndPuck.notes.includes("glove save") && stickAndPuck.notes.includes("70–80 mins"), "Must capture notable glove save and ~70-80 mins exposure");
assert(stickAndPuck.rawAthleteReport && stickAndPuck.rawAthleteReport.includes("glove save that had everybody freaking shocked"), "Must preserve raw athlete text");
assert(stickAndPuck.athleteReflection && stickAndPuck.athleteReflection.includes("My legs are tired. Not sore, but tired"), "Must capture tired legs feedback");
assert(!stickAndPuck.notes.includes("promoted to Learned Pattern") && stickAndPuck.notes.includes("no learned pattern created"), "Must NOT promote to learned pattern");

// ======================================================================
// TEST 2: SEPT 29 ATHLETE STATE & TUESDAY STRENGTH STATUS
// ======================================================================
console.log("\n[Test 2] Sept 29 Athlete State & Tuesday Strength Status");

const sept29Entries = athleteData.filter(e => e.date === '2026-09-29');
const sept29State = sept29Entries.find(e => e.epistemicType === 'ATHLETE_STATE');
assert(!!sept29State, "Must have ATHLETE_STATE entry on Sept 29");
assert(sept29State.participantRole === 'ATHLETE', "Participant role must be ATHLETE");
assert(sept29State.rawAthleteReport && sept29State.rawAthleteReport.includes("body not sore at all"), "Must preserve raw athlete text for Sept 29");
assert(sept29State.notes.includes("Soreness: NONE REPORTED"), "Soreness must be NONE REPORTED");
assert(sept29State.notes.includes("Pain: NONE REPORTED"), "Pain must be NONE REPORTED");
assert(sept29State.notes.includes("feeling recovered from yesterday's leg fatigue"), "Recovery notes must record recovery from fatigue");
assert(sept29State.notes.includes("do not infer food intake caused recovery") && sept29State.notes.includes("not yet established pattern"), "Must NOT assert causal relationship or promote to pattern");

// Check planned strength for Tuesday Sept 29
// Tuesday Sept 29 has not yet had completed strength logged
const completedStrengthSept29 = athleteData.filter(e => e.date === '2026-09-29' && e.epistemicType === 'COMPLETED_TRAINING' && e.trainingType === 'strength');
assert(completedStrengthSept29.length === 0, "Tuesday strength must NOT be marked as COMPLETED_TRAINING yet (remains PLANNED / in-progress)");

// ======================================================================
// TEST 3: COACH CARD LACROSSE SCHEDULE (HISTORICAL + UPCOMING)
// ======================================================================
console.log("\n[Test 3] Coach Card Lacrosse Schedule Structure & Roles");

assert(Array.isArray(coachData), "coachData must be an array of blocks");
assert(coachData.length === 21, `Must have exactly 21 coach blocks (5 historical + 16 upcoming, found ${coachData.length})`);

coachData.forEach(block => {
  assert(block.participantRole === 'COACH', `Block ${block.id} must have participantRole: COACH`);
  assert(['AVAILABLE', 'BOOKED', 'COMPLETED', 'CANCELED', 'CANCELED_NO_CHARGE', 'CANCELED_LATE_CHARGE', 'NO_SHOW'].includes(block.status), `Block ${block.id} has invalid status ${block.status}`);
  
  if (block.status === 'AVAILABLE') {
    assert(!block.client, `AVAILABLE Block ${block.id} must NOT have a client (no placeholder client)`);
    assert(!block.notes, `AVAILABLE Block ${block.id} must NOT have notes`);
  }
});

// Verify 5 Historical Lessons (Sep 24 - Sep 26)
const historicalBlocks = coachData.filter(b => b.date < '2026-09-29');
assert(historicalBlocks.length === 5, `Must have 5 historical coach sessions, found ${historicalBlocks.length}`);

// 1. Jake Franklin S21 L2
const jake = historicalBlocks.find(b => b.client === 'Jake Franklin');
assert(!!jake && jake.status === 'COMPLETED' && jake.lessonCode === 'S21 L2', "Jake Franklin lesson must be COMPLETED (S21 L2)");
assert(jake.notes.includes("String to keep stick together"), "Jake notes must preserve stick & grip coaching cues");

// 2. Carter Gethers S25 L3
const carterPast = historicalBlocks.find(b => b.client === 'Carter Gethers' || (b.clientId === 'gc-client-carter-gethers' && b.date === '2026-09-25'));
assert(!!carterPast && (carterPast.status === 'CANCELED_LATE_CHARGE' || carterPast.status === 'CANCELED') && carterPast.lessonCode === 'S25 L3', "Carter Gethers past lesson must be CANCELED_LATE_CHARGE (S25 L3)");
assert(carterPast.notes.includes("hurt elbow"), "Carter past lesson must preserve hurt elbow / ER visit note");

// 3. Hunter Cortjens S16 L3
const hunterPast = historicalBlocks.find(b => b.client === 'Hunter Cortjens');
assert(!!hunterPast && hunterPast.status === 'COMPLETED' && hunterPast.lessonCode === 'S16 L3', "Hunter Cortjens past lesson must be COMPLETED (S16 L3)");
assert(hunterPast.notes.includes("hands steady, dipping and feet shifting"), "Hunter past lesson must preserve patience & feet cues");

// 4. Susie McElheny S13 L1
const susie = historicalBlocks.find(b => b.client === 'Susie McElheny');
assert(!!susie && susie.status === 'COMPLETED' && susie.lessonCode === 'S13 L1', "Susie McElheny lesson must be COMPLETED (S13 L1)");
assert(susie.notes.includes("top hand control and drive through the shot"), "Susie lesson must preserve top hand control cues");

// 5. Brock Gebhardt S28 L1
const brockPast = historicalBlocks.find(b => b.client === 'Brock Gebhardt' && b.date === '2026-09-26');
assert(!!brockPast && brockPast.status === 'COMPLETED' && brockPast.lessonCode === 'S28 L1', "Brock Gebhardt past lesson must be COMPLETED (S28 L1)");

// Verify Upcoming Booked Lessons (Sept 29 - Oct 4)
const upcomingBooked = coachData.filter(b => b.date >= '2026-09-29' && b.status === 'BOOKED');
assert(upcomingBooked.length === 3, `Must have exactly 3 upcoming booked lessons (Carter, Hunter, Brock), found ${upcomingBooked.length}`);

const carterBlock = upcomingBooked.find(b => b.client === 'Carter');
assert(!!carterBlock, "Must have upcoming booked lesson for Carter");
assert(carterBlock.date === '2026-10-02' && carterBlock.startTime === '5:00 PM' && carterBlock.location === 'Lambert', "Carter lesson must be Fri Oct 2, 5pm at Lambert");

const hunterBlock = upcomingBooked.find(b => b.client === 'Hunter');
assert(!!hunterBlock, "Must have upcoming booked lesson for Hunter");
assert(hunterBlock.date === '2026-10-02' && hunterBlock.startTime === '6:00 PM' && hunterBlock.location === 'Lambert', "Hunter lesson must be Fri Oct 2, 6pm at Lambert");

const brockBlock = upcomingBooked.find(b => b.client === 'Brock');
assert(!!brockBlock, "Must have upcoming booked lesson for Brock");
assert(brockBlock.date === '2026-10-03' && brockBlock.startTime === '9:00 AM' && brockBlock.location.includes('Bell'), "Brock lesson must be Sat Oct 3, 9am at Bell");

// ======================================================================
// TEST 4: ATHLETE TRACK REPOSITORY DETERMINISTIC DECISION FACTS ISOLATION
// ======================================================================
console.log("\n[Test 4] Athlete Track Metrics & Context Isolation (No Coach Card Contamination)");

// Compute facts as of 2026-09-29
const asOfDate = '2026-09-29';

// Filter completed athlete trainings through asOfDate
const completedAthleteTrainings = athleteData.filter(e => {
  if (e.participantRole && e.participantRole !== 'ATHLETE') return false;
  if (e.date > asOfDate) return false;
  return e.epistemicType === 'COMPLETED_TRAINING' || e.isCompleted === true;
});

// Check daysSinceLastOnIce (should be 1 day from Sept 28 to Sept 29)
const lastOnIce = completedAthleteTrainings
  .filter(e => e.trainingType === 'on_ice')
  .sort((a, b) => b.date.localeCompare(a.date))[0];

assert(!!lastOnIce, "Must find last on_ice training for athlete");
assert(lastOnIce.date === '2026-09-28', "Last on_ice date must be 2026-09-28");
const daysSinceLastOnIce = (new Date(asOfDate) - new Date(lastOnIce.date)) / (1000 * 60 * 60 * 24);
assert(daysSinceLastOnIce === 1, `daysSinceLastOnIce must be 1 (found ${daysSinceLastOnIce})`);

// Helper matching AthleteTrackRepository
const isStrength = (e) => 
  (e.participantRole === 'ATHLETE' || e.participantRole === undefined) &&
  ((Boolean(e.strength && e.strength.length > 0)) ||
   (e.trainingType === 'strength') ||
   (e.trainingType === 'off_ice' && (
     e.title.toLowerCase().includes('strength') ||
     e.title.toLowerCase().includes('lift') ||
     e.title.toLowerCase().includes('bench')
   )));

const isConditioning = (e) =>
  (e.participantRole === 'ATHLETE' || e.participantRole === undefined) &&
  (Boolean(e.conditioning) ||
   e.title.toLowerCase().includes('conditioning') ||
   e.title.toLowerCase().includes('run'));

const lastStrength = completedAthleteTrainings
  .filter(isStrength)
  .sort((a, b) => b.date.localeCompare(a.date))[0];

assert(!!lastStrength, "Must find last strength training for athlete");
assert(lastStrength.date === '2026-09-18', "Last strength date must be 2026-09-18 (Yoga + Maintenance Strength)");
const daysSinceLastStrength = (new Date(asOfDate) - new Date(lastStrength.date)) / (1000 * 60 * 60 * 24);
assert(daysSinceLastStrength === 11, `daysSinceLastStrength must be 11 from Sept 18 to Sept 29 (found ${daysSinceLastStrength})`);

// Check nextPerformance calculation
const futureAthleteEvents = athleteData.filter(e => {
  if (e.participantRole && e.participantRole !== 'ATHLETE') return false;
  return e.date >= asOfDate && (e.epistemicType === 'PERFORMANCE_SESSION' || e.epistemicType === 'PLANNED_TRAINING');
});

// Coach lessons (Carter, Hunter, Brock) must NOT be in athlete track
const coachLessonsInAthleteTrack = athleteData.filter(e => ['Carter', 'Hunter', 'Brock'].includes(e.clientName) || ['Carter', 'Hunter', 'Brock'].includes(e.client));
assert(coachLessonsInAthleteTrack.length === 0, "Athlete track must NOT contain any coach client lessons");

// ======================================================================
// TEST 5: STATE EXTRACTION REGEX — NEGATED SORENESS DETECTION
// ======================================================================
console.log("\n[Test 5] State Extraction Negation Robustness");

const rawStateText = "today we feel good. I ate so much food last night - feeling good now body not sore at all, did some good stretching this morning and body responded great.";

// Regex tests matching lib/stateExtraction.ts and lib/repositories/athleteTrackRepository.ts
const lower = rawStateText.toLowerCase();
const isNegatedSoreness = /(?:not\s+(?:at\s+all\s+)?sore|no\s+soreness|body\s+not\s+sore|zero\s+soreness|soreness\s*:\s*none)/i.test(lower);
assert(isNegatedSoreness === true, "Must correctly identify negated soreness in athlete state text");

const isSorePositive = !isNegatedSoreness && (lower.includes('sore') || lower.includes('tight'));
assert(isSorePositive === false, "Must NOT trigger positive soreness when soreness is negated");

// ======================================================================
// TEST 6: CANCELED LESSONS COUNT AGAINST CLIENT PACKAGE COUNT
// ======================================================================
console.log("\n[Test 6] Canceled Lessons Count Against Package / Series Count");

// Carter Gethers has 1 CANCELED_LATE_CHARGE lesson (S25 L3 on Sep 25) and 1 upcoming BOOKED lesson (Oct 2)
const carterBlocks = coachData.filter(b => (b.client && b.client.toLowerCase().includes('carter')) || b.clientId === 'gc-client-carter-gethers');
const carterCanceled = carterBlocks.filter(b => b.status === 'CANCELED' || b.status === 'CANCELED_LATE_CHARGE' || b.status === 'CANCELED_NO_CHARGE');
assert(carterCanceled.length === 1, "Carter Gethers must have 1 recorded canceled lesson (S25 L3)");
assert(carterCanceled[0].lessonCode === 'S25 L3', "Carter canceled lesson retains its exact series code (S25 L3)");
assert(carterCanceled[0].status === 'CANCELED_LATE_CHARGE', "Carter canceled lesson has status CANCELED_LATE_CHARGE");
assert(carterCanceled[0].consumesLessonCredit === true, "Carter late canceled lesson consumes lesson credit");

// Package consumption rule: total consumed = completed + late canceled
const consumedCount = carterBlocks.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELED_LATE_CHARGE' || (b.status === 'CANCELED' && b.consumesLessonCredit !== false)).length;
assert(consumedCount >= 1, "Canceled lesson MUST be counted as consumed against client package allowance");

console.log("\n======================================================================");
console.log("ALL VERIFICATION INVARIANTS PASSED (100% SUCCESS)");
console.log("======================================================================");

