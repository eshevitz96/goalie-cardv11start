/**
 * GOALIE CARD — TEST CONTEXT AND PROMPT GENERATION AS OF OCT 1, 2026
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load historical baseline from lib/athleteTrainingHistory.ts
const historyFile = fs.readFileSync(path.join(process.cwd(), 'lib', 'athleteTrainingHistory.ts'), 'utf8');

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
const dynamicRecords = JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));

console.log("=================================================");
console.log("VERIFYING SEPTEMBER TRACK UNIFIED TIMELINE AS OF OCT 1, 2026");
console.log("=================================================");

console.log("Dynamic records count:", dynamicRecords.length);
dynamicRecords.forEach(r => {
  console.log(`- [${r.date}] [${r.epistemicType}] [${r.participantRole || 'ATHLETE'}] ${r.title} | Duration: ${r.durationMins}`);
});

// Let's test the queries requested by TEST A and TEST B
console.log("\n=================================================");
console.log("TEST A: Last 3 Days (Sept 28 - Sept 30) Evidence Check");
console.log("=================================================");
const last3Days = dynamicRecords.filter(r => r.date >= '2026-09-28' && r.date <= '2026-09-30');
console.log("Entries in last 3 days (Sept 28-30):", last3Days.length);
last3Days.forEach(r => {
  console.log(`[${r.date}] ${r.title}`);
  if (r.athleteReflection) console.log(`  Reflection: ${r.athleteReflection}`);
  if (r.rawAthleteReport) console.log(`  Raw: ${r.rawAthleteReport}`);
});

console.log("\n=================================================");
console.log("TEST B: Full September Progression Evidence Check");
console.log("=================================================");
const allSeptDynamic = dynamicRecords.filter(r => r.date.startsWith('2026-09'));
console.log("All September dynamic entries:", allSeptDynamic.length);

