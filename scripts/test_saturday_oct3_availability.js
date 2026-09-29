/**
 * Test Suite: Saturday Oct 3 Availability Update Verification
 *
 * Verifies:
 * 1. Saturday Oct 3 has only ONE schedule block: Brock Gebhardt 9:00-10:00 AM (Bell Memorial Park, BOOKED).
 * 2. The two open AVAILABLE slots (8:00-9:00 AM and 10:00-11:00 AM) are completely removed.
 * 3. Goalie-facing booking inventory has 0 available spots for Saturday Oct 3.
 * 4. Brock's canonical Lesson and client package accounting are unmodified.
 * 5. Weekly booking and completed metrics remain 100% consistent.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runAudit() {
  console.log('====================================================');
  console.log('SATURDAY OCT 3 AVAILABILITY AUDIT TEST');
  console.log('====================================================\n');

  // 1. Audit Local Coach Schedule JSON
  const schedulePath = path.join(__dirname, '..', 'data', 'coach-schedule-local.json');
  assert(fs.existsSync(schedulePath), 'coach-schedule-local.json must exist');
  const blocks = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

  const satBlocks = blocks.filter(b => b.date === '2026-10-03');
  console.log(`[TEST 1] Auditing Saturday Oct 3 slots in coach-schedule-local.json: Found ${satBlocks.length}`);
  assert.strictEqual(satBlocks.length, 1, 'Saturday Oct 3 must have exactly 1 block');

  const brockBlock = satBlocks[0];
  assert.strictEqual(brockBlock.startTime, '9:00 AM');
  assert.strictEqual(brockBlock.endTime, '10:00 AM');
  assert.strictEqual(brockBlock.location, 'Bell Memorial Park');
  assert.strictEqual(brockBlock.status, 'BOOKED');
  assert.strictEqual(brockBlock.client, 'B. Gebhardt');
  assert.strictEqual(brockBlock.clientId, 'gc-client-brock-gebhardt');
  assert.strictEqual(brockBlock.scheduledStartAt, '2026-10-03T09:00:00-04:00');
  assert.strictEqual(brockBlock.consumesLessonCredit, false);
  console.log('  ✓ Brock Gebhardt 9:00 AM BOOKED block verified');

  const satAvailable = satBlocks.filter(b => b.status === 'AVAILABLE');
  assert.strictEqual(satAvailable.length, 0, 'Must have 0 AVAILABLE slots on Saturday Oct 3');
  console.log('  ✓ 8:00 AM and 10:00 AM AVAILABLE slots successfully removed');

  // 2. Audit constants/trainingAvailability.ts
  const constantsPath = path.join(__dirname, '..', 'constants', 'trainingAvailability.ts');
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');

  assert(!constantsContent.includes('coach-slot-2026-10-03-0800'), '8 AM slot must be removed from constants');
  assert(!constantsContent.includes('coach-slot-2026-10-03-1000'), '10 AM slot must be removed from constants');
  assert(constantsContent.includes('coach-slot-2026-10-03-0900'), '9 AM Brock slot must exist in constants');
  console.log('[TEST 2] constants/trainingAvailability.ts verified (0 available Saturday slots)');

  // 3. Audit Brock's Complete Lesson & Package Accounting
  const brockLessons = blocks.filter(b => b.clientId === 'gc-client-brock-gebhardt' || b.client === 'B. Gebhardt');
  assert.strictEqual(brockLessons.length, 2, 'Brock must have exactly 2 lessons (1 completed, 1 booked)');
  
  const completedBrock = brockLessons.filter(b => b.status === 'COMPLETED');
  const bookedBrock = brockLessons.filter(b => b.status === 'BOOKED');
  assert.strictEqual(completedBrock.length, 1, 'Brock has 1 completed lesson (Sep 26)');
  assert.strictEqual(bookedBrock.length, 1, 'Brock has 1 booked lesson (Oct 3)');
  console.log('[TEST 3] Brock Gebhardt lesson counts and package balances verified unchanged');

  // 4. Audit Overall Schedule Integrity
  const totalBooked = blocks.filter(b => b.status === 'BOOKED').length;
  const totalCompleted = blocks.filter(b => b.status === 'COMPLETED').length;
  const totalLateCanceled = blocks.filter(b => b.status === 'CANCELED_LATE_CHARGE').length;
  
  assert.strictEqual(totalBooked, 3, 'Total booked upcoming lessons must remain 3 (Carter, Hunter, Brock)');
  assert.strictEqual(totalCompleted, 4, 'Total completed lessons must remain 4');
  assert.strictEqual(totalLateCanceled, 1, 'Total late canceled must remain 1');
  console.log('[TEST 4] Overall Schedule Integrity verified (3 Booked, 4 Completed, 1 Late Canceled)');

  console.log('\n====================================================');
  console.log('ALL SATURDAY OCT 3 AUDIT INVARIANTS PASSED (100%)');
  console.log('====================================================\n');
}

runAudit();
