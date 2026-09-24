/**
 * VERIFICATION SCRIPT FOR SEPT 17–25 BACKFILL
 */

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

const localJsonPath = path.join(process.cwd(), 'data', 'athlete-track-local.json');
const dynamicRecords = JSON.parse(fs.readFileSync(localJsonPath, 'utf-8'));

console.log("=================================================");
console.log("ATHLETE TRACK POST-BACKFILL VERIFICATION (SEPT 17–25)");
console.log("=================================================\n");

// 1. Check dynamic records length and dates
console.log("[1] Active Dynamic Records for Sept 17–25:");
dynamicRecords.forEach(r => {
  console.log(`- [${r.date}] (${r.epistemicType}) ${r.title} | Duration: ${r.durationMins !== null ? `${r.durationMins}m` : 'UNKNOWN/NULL'}`);
});

// 2. Freshness calculation as of 2026-09-24
let completedTrainingThrough = "2026-09-16"; // Initial baseline
let athleteStateThrough = "2026-09-16";
let activityContextThrough = "2026-09-16";
let nextPerformance = {
  eventDate: null,
  eventType: null,
  eventName: null,
  daysRemaining: null,
  source: 'NONE'
};

const targetDate = "2026-09-24";

dynamicRecords.forEach(entry => {
  if (entry.epistemicType === 'PLANNED_EVENT') {
    if (!nextPerformance.eventDate && entry.date >= targetDate) {
      const today = new Date(targetDate);
      const evtDate = new Date(entry.date);
      const diffDays = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextPerformance = {
        eventDate: entry.date,
        eventType: entry.trainingType || 'on_ice',
        eventName: entry.title,
        daysRemaining: Math.max(0, diffDays),
        source: 'LOCAL_STORE'
      };
    }
    return; // Planned events do not advance historical track freshness
  }

  if (entry.date <= targetDate) {
    if (entry.epistemicType === 'COMPLETED_TRAINING') {
      if (entry.date > completedTrainingThrough) {
        completedTrainingThrough = entry.date;
      }
    }

    if (entry.epistemicType === 'ATHLETE_STATE' || entry.athleteReflection) {
      if (entry.date > athleteStateThrough) {
        athleteStateThrough = entry.date;
      }
    }

    if (entry.date > activityContextThrough) {
      activityContextThrough = entry.date;
    }
  }
});

console.log("\n[2] Computed Context Freshness (as of 2026-09-24):");
console.log(`- completedTrainingThrough: ${completedTrainingThrough}`);
console.log(`- athleteStateThrough:      ${athleteStateThrough}`);
console.log(`- activityContextThrough:    ${activityContextThrough}`);
console.log(`- nextPerformance:`, JSON.stringify(nextPerformance, null, 2));

// 3. Verifications
function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log("\n[3] Invariant Assertions:");
assert(completedTrainingThrough === "2026-09-23", "completedTrainingThrough must equal 2026-09-23 (Run + recovery on Sept 23)");
assert(athleteStateThrough === "2026-09-24", "athleteStateThrough must equal 2026-09-24 (Athlete soreness report on Sept 24)");
assert(activityContextThrough === "2026-09-24", "activityContextThrough must equal 2026-09-24 (Lacrosse goalie coaching on Sept 24)");
assert(nextPerformance.eventDate === "2026-09-25", "nextPerformance must identify 2026-09-25 stick & puck");
assert(nextPerformance.daysRemaining === 1, "nextPerformance daysRemaining must equal 1 day from Sept 24");

// 4. Check Sept 24 coaching activity properties
const sept24 = dynamicRecords.find(r => r.date === '2026-09-24');
assert(sept24.epistemicType === 'UNSTRUCTURED_ACTIVITY', "Sept 24 coaching must be UNSTRUCTURED_ACTIVITY, not COMPLETED_TRAINING");
assert(sept24.durationMins === null, "Sept 24 duration must remain null");

// 5. Check Sept 21 stick & puck duration
const sept21 = dynamicRecords.find(r => r.date === '2026-09-21');
assert(sept21.durationMins === null, "Sept 21 stick & puck duration must remain null (unknown)");

// 6. Check Sept 25 planned status
const sept25 = dynamicRecords.find(r => r.date === '2026-09-25');
assert(sept25.epistemicType === 'PLANNED_EVENT', "Sept 25 must be PLANNED_EVENT only");

console.log("\n=================================================");
console.log("POST-BACKFILL VERIFICATION SUCCESSFUL (100%)");
console.log("=================================================");
