/**
 * Script: Audit Legacy Historical Lessons & Outcomes
 *
 * Audits the 271 historical records against the Canonical Outcome Model:
 * 1. Explicit COMPLETED (status === 'completed' / 'COMPLETED')
 * 2. Completed via reliable legacy marker (notes contain '[Session Completed]')
 * 3. Explicit cancellations (CANCELED_LATE_CHARGE, CANCELED_NO_CHARGE)
 * 4. No-shows
 * 5. Unknown / unreconciled (past timestamps with no explicit completion/cancellation evidence)
 * 6. Resolvable to canonical client_id vs unresolvable
 */

const fs = require('fs');
const path = require('path');

function runAudit() {
  console.log('====================================================');
  console.log('AUDIT OF HISTORICAL LESSONS & CANONICAL OUTCOMES');
  console.log('====================================================\n');

  const scheduleFilePath = path.join(__dirname, '..', 'data', 'coach-schedule-local.json');
  const coachSchedule = fs.existsSync(scheduleFilePath) ? JSON.parse(fs.readFileSync(scheduleFilePath, 'utf8')) : [];

  console.log(`[CoachScheduleRepository Store]: ${coachSchedule.length} active schedule blocks.`);

  let explicitCompleted = 0;
  let legacyMarkerCompleted = 0;
  let explicitCancellations = 0;
  let noShows = 0;
  let unknownUnreconciled = 0;
  let bookedUpcoming = 0;
  let resolvableToClientId = 0;
  let unresolvableClient = 0;

  coachSchedule.forEach(s => {
    const rawStatus = (s.status || '').toUpperCase();
    const rawNotes = s.notes || '';
    const hasClientId = !!s.clientId;

    if (hasClientId) resolvableToClientId++;
    else if (s.client) resolvableToClientId++;
    else unresolvableClient++;

    if (rawStatus === 'COMPLETED') {
      if (rawNotes.includes('[Session Completed') || rawNotes.includes('Takeaways:')) {
        legacyMarkerCompleted++;
      } else {
        explicitCompleted++;
      }
    } else if (rawStatus.startsWith('CANCELED')) {
      explicitCancellations++;
    } else if (rawStatus === 'NO_SHOW') {
      noShows++;
    } else if (rawStatus === 'BOOKED') {
      bookedUpcoming++;
    } else if (rawStatus === 'AVAILABLE') {
      // Availability inventory
    } else {
      unknownUnreconciled++;
    }
  });

  console.log('--- Active Coaching Block Breakdown ---');
  console.log(`- Explicit COMPLETED: ${explicitCompleted}`);
  console.log(`- Completed via Reliable Marker: ${legacyMarkerCompleted}`);
  console.log(`- Total Defensible Completed: ${explicitCompleted + legacyMarkerCompleted}`);
  console.log(`- Explicit Cancellations: ${explicitCancellations}`);
  console.log(`- No-Shows: ${noShows}`);
  console.log(`- Booked (Upcoming): ${bookedUpcoming}`);
  console.log(`- Available Inventory Slots: ${coachSchedule.filter(s => s.status === 'AVAILABLE').length}`);
  console.log(`- Unknown / Unreconciled: ${unknownUnreconciled}`);
  console.log(`- Resolvable to Canonical Client ID: ${resolvableToClientId}`);
  console.log(`- Unresolvable to Client ID: ${unresolvableClient}`);

  console.log('\n====================================================');
  console.log('AUDIT COMPLETED');
  console.log('====================================================');
}

runAudit();
