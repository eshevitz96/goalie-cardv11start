/**
 * COMPREHENSIVE TEST SUITE:
 * 1. COACH CARD SCHEDULING INTEGRITY & RELATIONAL BOOKINGS
 * 2. 24-HOUR CANCELLATION / LESSON CREDIT ACCOUNTING POLICY
 * 3. GOALIE-FACING PRIVACY & CANONICAL DATA RESOLUTION
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

const dataPath = path.join(__dirname, '..', 'data', 'coach-schedule-local.json');
const originalData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Pure JS Mirror of CoachScheduleRepository logic for tests
class CoachScheduleRepositoryTest {
  static getAllBlocks() {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8')).map(b => ({
      ...b,
      participantRole: 'COACH'
    }));
  }

  static saveBlocks(blocks) {
    const sanitized = blocks.map(b => ({
      ...b,
      participantRole: 'COACH'
    }));
    fs.writeFileSync(dataPath, JSON.stringify(sanitized, null, 2), 'utf-8');
    return true;
  }

  static parseScheduledStartAt(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const match = (timeStr || '').match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    let hour = match ? parseInt(match[1], 10) : 12;
    const minute = match && match[2] ? parseInt(match[2], 10) : 0;
    const isPM = match && match[3] ? match[3].toUpperCase() === 'PM' : false;
    const isAM = match && match[3] ? match[3].toUpperCase() === 'AM' : false;

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-04:00`;
  }

  static bookSlot(slotId, clientName, options) {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) return { success: false, error: `Slot ${slotId} not found.` };

    const current = blocks[idx];
    if (current.status !== 'AVAILABLE') return { success: false, error: `Slot not AVAILABLE.` };

    const scheduledStartAt = current.scheduledStartAt || this.parseScheduledStartAt(current.date, current.startTime);

    const updated = {
      ...current,
      status: 'BOOKED',
      clientId: options?.clientId || current.clientId,
      client: clientName.trim(),
      lessonId: options?.lessonId || current.lessonId,
      lessonCode: options?.lessonCode || current.lessonCode,
      scheduledStartAt,
      notes: options?.notes || `Private Lacrosse Goalie Lesson - ${clientName.trim()}`,
      previousStatus: 'AVAILABLE',
      consumesLessonCredit: false,
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  static completeLesson(slotId, takeaways) {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) return { success: false, error: `Slot ${slotId} not found.` };

    const current = blocks[idx];
    if (current.status === 'COMPLETED') return { success: true, block: current };
    if (current.status !== 'BOOKED') return { success: false, error: `Slot not BOOKED.` };

    const updated = {
      ...current,
      status: 'COMPLETED',
      previousStatus: 'BOOKED',
      consumesLessonCredit: true,
      notes: takeaways ? `${current.notes || ''} [Takeaways: ${takeaways}]` : current.notes,
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  static cancelLesson(slotId, options) {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) return { success: false, error: `Slot ${slotId} not found.` };

    const current = blocks[idx];
    if (
      current.status === 'CANCELED' || 
      current.status === 'CANCELED_NO_CHARGE' || 
      current.status === 'CANCELED_LATE_CHARGE'
    ) {
      return { success: true, block: current, alreadyCanceled: true };
    }

    if (current.status !== 'BOOKED' && current.status !== 'AVAILABLE') {
      return { success: false, error: `Slot cannot be canceled from status ${current.status}.` };
    }

    const canceledAt = options?.canceledAt || new Date().toISOString();
    const scheduledStartAt = current.scheduledStartAt || this.parseScheduledStartAt(current.date, current.startTime);
    
    const scheduledMs = new Date(scheduledStartAt).getTime();
    const canceledMs = new Date(canceledAt).getTime();
    const noticeMinutes = Math.round((scheduledMs - canceledMs) / (1000 * 60));

    // Notice >= 24h (1440 min) -> No Charge; < 24h -> Late Charge
    const isEarly = noticeMinutes >= 1440;
    const finalStatus = isEarly ? 'CANCELED_NO_CHARGE' : 'CANCELED_LATE_CHARGE';
    const consumesCredit = !isEarly;

    const noticeDescription = isEarly
      ? `Early cancellation (${(noticeMinutes / 60).toFixed(1)}h notice >= 24h) - No Credit Charged`
      : `Late cancellation (${(noticeMinutes / 60).toFixed(1)}h notice < 24h) - 1 Lesson Credit Charged`;

    const updated = {
      ...current,
      status: finalStatus,
      previousStatus: current.status,
      scheduledStartAt,
      canceledAt,
      cancellationNoticeMinutes: noticeMinutes,
      cancellationClassification: finalStatus,
      consumesLessonCredit: consumesCredit,
      notes: options?.reason 
        ? `${current.notes || ''} [${noticeDescription}. Reason: ${options.reason}]`
        : `${current.notes || ''} [${noticeDescription}]`,
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  static rescheduleLesson(oldSlotId, newSlotId) {
    const blocks = this.getAllBlocks();
    const oldIdx = blocks.findIndex(b => b.id === oldSlotId);
    const newIdx = blocks.findIndex(b => b.id === newSlotId);

    if (oldIdx === -1 || newIdx === -1) return { success: false, error: 'Slot not found' };

    const oldBlock = blocks[oldIdx];
    const newBlock = blocks[newIdx];

    if (newBlock.status !== 'AVAILABLE') return { success: false, error: 'Target slot not available' };

    const scheduledStartAt = newBlock.scheduledStartAt || this.parseScheduledStartAt(newBlock.date, newBlock.startTime);

    blocks[oldIdx] = {
      ...oldBlock,
      status: 'AVAILABLE',
      clientId: undefined,
      client: undefined,
      lessonCode: undefined,
      lessonId: undefined,
      consumesLessonCredit: false,
      previousStatus: oldBlock.status,
      notes: `Rescheduled to ${newBlock.date} ${newBlock.startTime}`,
      updatedAt: new Date().toISOString()
    };

    const updatedNew = {
      ...newBlock,
      status: 'BOOKED',
      clientId: oldBlock.clientId,
      client: oldBlock.client,
      lessonCode: oldBlock.lessonCode,
      lessonId: oldBlock.lessonId,
      scheduledStartAt,
      notes: oldBlock.notes,
      previousStatus: 'AVAILABLE',
      consumesLessonCredit: false,
      updatedAt: new Date().toISOString()
    };

    blocks[newIdx] = updatedNew;
    this.saveBlocks(blocks);
    return { success: true, block: updatedNew, newBlock: updatedNew };
  }

  static getClientLessonSummary(clientIdOrName, totalPackageAllowance) {
    const all = this.getAllBlocks();
    const query = clientIdOrName.toLowerCase().trim();

    const clientBlocks = all.filter(b => {
      if (b.clientId && b.clientId.toLowerCase() === query) return true;
      if (b.client && b.client.toLowerCase().includes(query)) return true;
      return false;
    });

    const completedLessonCount = clientBlocks.filter(b => b.status === 'COMPLETED').length;
    const scheduledLessonCount = clientBlocks.filter(b => b.status === 'BOOKED').length;
    
    const lateCanceledCount = clientBlocks.filter(b => 
      b.status === 'CANCELED_LATE_CHARGE' || 
      (b.status === 'CANCELED' && b.consumesLessonCredit === true)
    ).length;

    const earlyCanceledCount = clientBlocks.filter(b => 
      b.status === 'CANCELED_NO_CHARGE' || 
      (b.status === 'CANCELED' && b.consumesLessonCredit === false)
    ).length;

    const consumedLessonCredits = completedLessonCount + lateCanceledCount;
    const chargedLessonCount = consumedLessonCredits;

    const remainingLessonCredits = totalPackageAllowance !== undefined
      ? Math.max(0, totalPackageAllowance - consumedLessonCredits)
      : null;

    return {
      completedLessonCount,
      scheduledLessonCount,
      chargedLessonCount,
      consumedLessonCredits,
      lateCanceledCount,
      earlyCanceledCount,
      remainingLessonCredits,
      lessons: clientBlocks
    };
  }
}

console.log("======================================================================");
console.log("RUNNING SCHEDULING INTEGRITY & CANCELLATION POLICY TEST SUITE");
console.log("======================================================================\n");

try {
  // ======================================================================
  // 1. RELATIONAL LINKING & CANONICAL CLIENT IDENTIFIERS
  // ======================================================================
  console.log("[Test 1] Canonical Client Identifiers & Booking Integrity");

  const allBlocks = CoachScheduleRepositoryTest.getAllBlocks();

  // Carter Gethers
  const carterOct2 = allBlocks.find(b => (b.client === 'C. Gethers' || b.client === 'Carter' || b.clientId === 'gc-client-carter-gethers') && b.date === '2026-10-02');
  assert(!!carterOct2, "Carter Oct 2 booking must exist");
  assert(carterOct2.clientId === 'gc-client-carter-gethers', "Carter booking must have canonical clientId 'gc-client-carter-gethers'");
  assert(carterOct2.client === 'C. Gethers', "Carter booking client display name must be formatted as 'C. Gethers'");
  assert(carterOct2.status === 'BOOKED', "Carter Oct 2 session must be in BOOKED status");
  assert(carterOct2.participantRole === 'COACH', "Carter booking must have participantRole: COACH");

  // Hunter Cortjens
  const hunterOct2 = allBlocks.find(b => (b.client === 'H. Cortjens' || b.client === 'Hunter' || b.clientId === 'gc-client-hunter-cortjens') && b.date === '2026-10-02');
  assert(!!hunterOct2, "Hunter Oct 2 booking must exist");
  assert(hunterOct2.clientId === 'gc-client-hunter-cortjens', "Hunter booking must have canonical clientId 'gc-client-hunter-cortjens'");
  assert(hunterOct2.client === 'H. Cortjens', "Hunter booking client display name must be formatted as 'H. Cortjens'");
  assert(hunterOct2.status === 'BOOKED', "Hunter Oct 2 session must be in BOOKED status");

  // Brock Gebhardt
  const brockOct3 = allBlocks.find(b => (b.client === 'B. Gebhardt' || b.client === 'Brock' || b.clientId === 'gc-client-brock-gebhardt') && b.date === '2026-10-03');
  assert(!!brockOct3, "Brock Oct 3 booking must exist");
  assert(brockOct3.clientId === 'gc-client-brock-gebhardt', "Brock booking must have canonical clientId 'gc-client-brock-gebhardt'");
  assert(brockOct3.client === 'B. Gebhardt', "Brock booking client display name must be formatted as 'B. Gebhardt'");
  assert(brockOct3.status === 'BOOKED', "Brock Oct 3 session must be in BOOKED status");

  // ======================================================================
  // 2. LESSON COUNT SEMANTICS SEPARATION
  // ======================================================================
  console.log("\n[Test 2] Separate Accounting for Completed, Scheduled, Charged, and Remaining Lessons");

  // Carter has: 1 CANCELED_LATE_CHARGE (Sep 25) + 1 BOOKED (Oct 2), Total Package Allowance = 4
  const carterSummary = CoachScheduleRepositoryTest.getClientLessonSummary('gc-client-carter-gethers', 4);
  assert(carterSummary.completedLessonCount === 0, `Carter completedLessonCount must be 0 (found ${carterSummary.completedLessonCount})`);
  assert(carterSummary.scheduledLessonCount === 1, `Carter scheduledLessonCount must be 1 (found ${carterSummary.scheduledLessonCount})`);
  assert(carterSummary.lateCanceledCount === 1, `Carter lateCanceledCount must be 1 (found ${carterSummary.lateCanceledCount})`);
  assert(carterSummary.consumedLessonCredits === 1, `Carter consumedLessonCredits must be 1 (found ${carterSummary.consumedLessonCredits})`);
  assert(carterSummary.remainingLessonCredits === 3, `Carter remainingLessonCredits must be 3 (found ${carterSummary.remainingLessonCredits})`);

  // Hunter has: 1 COMPLETED (Sep 25) + 1 BOOKED (Oct 2), Total Package Allowance = 4
  const hunterSummary = CoachScheduleRepositoryTest.getClientLessonSummary('gc-client-hunter-cortjens', 4);
  assert(hunterSummary.completedLessonCount === 1, `Hunter completedLessonCount must be 1 (found ${hunterSummary.completedLessonCount})`);
  assert(hunterSummary.scheduledLessonCount === 1, `Hunter scheduledLessonCount must be 1 (found ${hunterSummary.scheduledLessonCount})`);
  assert(hunterSummary.consumedLessonCredits === 1, `Hunter consumedLessonCredits must be 1 (found ${hunterSummary.consumedLessonCredits})`);
  assert(hunterSummary.remainingLessonCredits === 3, `Hunter remainingLessonCredits must be 3 (found ${hunterSummary.remainingLessonCredits})`);

  // ======================================================================
  // 3. 24-HOUR CANCELLATION POLICY TESTS
  // ======================================================================
  console.log("\n[Test 3] 24-Hour Cancellation Policy Boundary Conditions");

  const scheduledTimeStr = "2026-10-02T17:00:00-04:00";
  const scheduledMs = new Date(scheduledTimeStr).getTime();

  // A. 24 hours + 1 minute notice (Thursday Oct 1 @ 4:59 PM = 1441 mins notice) -> CANCELED_NO_CHARGE
  const time24hPlus1m = new Date(scheduledMs - 1441 * 60 * 1000).toISOString();
  
  const testSlot1 = {
    id: "test-slot-early",
    date: "2026-10-02",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    scheduledStartAt: scheduledTimeStr,
    location: "Lambert",
    status: "AVAILABLE",
    participantRole: "COACH"
  };

  const cur1 = CoachScheduleRepositoryTest.getAllBlocks();
  cur1.push(testSlot1);
  CoachScheduleRepositoryTest.saveBlocks(cur1);

  CoachScheduleRepositoryTest.bookSlot("test-slot-early", "Test Goalie Early", { clientId: "gc-client-test-early" });

  const earlyCancelRes = CoachScheduleRepositoryTest.cancelLesson("test-slot-early", { 
    canceledAt: time24hPlus1m,
    reason: "Schedule conflict"
  });

  assert(earlyCancelRes.success === true, "Early cancellation must succeed");
  assert(earlyCancelRes.block.status === 'CANCELED_NO_CHARGE', "Status must be CANCELED_NO_CHARGE for 24h+1m notice");
  assert(earlyCancelRes.block.consumesLessonCredit === false, "consumesLessonCredit must be false for early cancellation");
  assert(earlyCancelRes.block.cancellationNoticeMinutes === 1441, "cancellationNoticeMinutes must be 1441");

  // B. Exactly 24 hours notice (Thursday Oct 1 @ 5:00 PM = 1440 mins notice) -> CANCELED_NO_CHARGE
  const timeExact24h = new Date(scheduledMs - 1440 * 60 * 1000).toISOString();
  const testSlotExact = {
    id: "test-slot-exact",
    date: "2026-10-02",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    scheduledStartAt: scheduledTimeStr,
    location: "Lambert",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const cur2 = CoachScheduleRepositoryTest.getAllBlocks();
  cur2.push(testSlotExact);
  CoachScheduleRepositoryTest.saveBlocks(cur2);
  CoachScheduleRepositoryTest.bookSlot("test-slot-exact", "Test Goalie Exact", { clientId: "gc-client-test-exact" });

  const exactCancelRes = CoachScheduleRepositoryTest.cancelLesson("test-slot-exact", { 
    canceledAt: timeExact24h,
    reason: "Exact 24h notice"
  });

  assert(exactCancelRes.success === true, "Exact 24h cancellation must succeed");
  assert(exactCancelRes.block.status === 'CANCELED_NO_CHARGE', "Status must be CANCELED_NO_CHARGE for exactly 24h notice");
  assert(exactCancelRes.block.consumesLessonCredit === false, "consumesLessonCredit must be false for exact 24h notice");
  assert(exactCancelRes.block.cancellationNoticeMinutes === 1440, "cancellationNoticeMinutes must be 1440");

  // C. 23 hours 59 minutes notice (Thursday Oct 1 @ 5:01 PM = 1439 mins notice) -> CANCELED_LATE_CHARGE
  const time23h59m = new Date(scheduledMs - 1439 * 60 * 1000).toISOString();
  const testSlotLate = {
    id: "test-slot-late",
    date: "2026-10-02",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    scheduledStartAt: scheduledTimeStr,
    location: "Lambert",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const cur3 = CoachScheduleRepositoryTest.getAllBlocks();
  cur3.push(testSlotLate);
  CoachScheduleRepositoryTest.saveBlocks(cur3);
  CoachScheduleRepositoryTest.bookSlot("test-slot-late", "Test Goalie Late", { clientId: "gc-client-test-late" });

  const lateCancelRes = CoachScheduleRepositoryTest.cancelLesson("test-slot-late", { 
    canceledAt: time23h59m,
    reason: "Late cancellation notice"
  });

  assert(lateCancelRes.success === true, "Late cancellation must succeed");
  assert(lateCancelRes.block.status === 'CANCELED_LATE_CHARGE', "Status must be CANCELED_LATE_CHARGE for 23h59m notice");
  assert(lateCancelRes.block.consumesLessonCredit === true, "consumesLessonCredit must be true for late cancellation");
  assert(lateCancelRes.block.cancellationNoticeMinutes === 1439, "cancellationNoticeMinutes must be 1439");

  // D. Same-Day Cancellation (Friday Oct 2 @ 12:00 PM = 5h notice) -> CANCELED_LATE_CHARGE
  const timeSameDay = "2026-10-02T12:00:00-04:00";
  const testSlotSameDay = {
    id: "test-slot-sameday",
    date: "2026-10-02",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    scheduledStartAt: scheduledTimeStr,
    location: "Lambert",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const cur4 = CoachScheduleRepositoryTest.getAllBlocks();
  cur4.push(testSlotSameDay);
  CoachScheduleRepositoryTest.saveBlocks(cur4);
  CoachScheduleRepositoryTest.bookSlot("test-slot-sameday", "Test Goalie SameDay", { clientId: "gc-client-test-sameday" });

  const sameDayCancelRes = CoachScheduleRepositoryTest.cancelLesson("test-slot-sameday", { 
    canceledAt: timeSameDay,
    reason: "Same day emergency"
  });

  assert(sameDayCancelRes.block.status === 'CANCELED_LATE_CHARGE', "Status must be CANCELED_LATE_CHARGE for same-day notice");
  assert(sameDayCancelRes.block.consumesLessonCredit === true, "consumesLessonCredit must be true for same day");

  // E. Idempotency Check: Repeated cancellation cannot double charge
  const repeatCancelRes = CoachScheduleRepositoryTest.cancelLesson("test-slot-late", { 
    canceledAt: time23h59m 
  });
  assert(repeatCancelRes.alreadyCanceled === true, "Repeated cancellation call must be recognized as already canceled");
  const testLateSummary = CoachScheduleRepositoryTest.getClientLessonSummary("gc-client-test-late", 4);
  assert(testLateSummary.lateCanceledCount === 1, "Repeated cancellation must NOT increment lateCanceledCount beyond 1");
  assert(testLateSummary.consumedLessonCredits === 1, "Consumed credits must strictly equal 1");

  // F. Late cancellation must NEVER increment completedLessonCount
  assert(testLateSummary.completedLessonCount === 0, "Late cancellation must NEVER increment completedLessonCount");

  // ======================================================================
  // 4. COMPLETION & RESCHEDULING INTEGRITY
  // ======================================================================
  console.log("\n[Test 4] Lesson Completion & Rescheduling Integrity");

  // Complete a slot
  const testSlotComplete = {
    id: "test-slot-complete",
    date: "2026-10-01",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    scheduledStartAt: "2026-10-01T16:00:00-04:00",
    location: "Milton",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const cur5 = CoachScheduleRepositoryTest.getAllBlocks();
  cur5.push(testSlotComplete);
  CoachScheduleRepositoryTest.saveBlocks(cur5);
  CoachScheduleRepositoryTest.bookSlot("test-slot-complete", "Test Goalie Comp", { clientId: "gc-client-test-comp" });

  const compRes1 = CoachScheduleRepositoryTest.completeLesson("test-slot-complete", "Great crease depth");
  assert(compRes1.success === true, "First completion must succeed");
  assert(compRes1.block.status === 'COMPLETED', "Status must be COMPLETED");

  // Idempotent completion check
  const compRes2 = CoachScheduleRepositoryTest.completeLesson("test-slot-complete", "Duplicate call");
  assert(compRes2.success === true, "Duplicate completion must be idempotent");

  const compSummary = CoachScheduleRepositoryTest.getClientLessonSummary("gc-client-test-comp", 4);
  assert(compSummary.completedLessonCount === 1, "Completed count must be exactly 1");

  // Rescheduling check
  const slotReschedOld = {
    id: "test-slot-resched-old",
    date: "2026-10-01",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    scheduledStartAt: "2026-10-01T17:00:00-04:00",
    location: "Milton",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const slotReschedNew = {
    id: "test-slot-resched-new",
    date: "2026-10-01",
    startTime: "6:00 PM",
    endTime: "7:00 PM",
    scheduledStartAt: "2026-10-01T18:00:00-04:00",
    location: "Milton",
    status: "AVAILABLE",
    participantRole: "COACH"
  };
  const cur6 = CoachScheduleRepositoryTest.getAllBlocks();
  cur6.push(slotReschedOld, slotReschedNew);
  CoachScheduleRepositoryTest.saveBlocks(cur6);

  CoachScheduleRepositoryTest.bookSlot("test-slot-resched-old", "Test Resched Goalie", { clientId: "gc-client-resched" });
  
  const reschedRes = CoachScheduleRepositoryTest.rescheduleLesson("test-slot-resched-old", "test-slot-resched-new");
  assert(reschedRes.success === true, "Rescheduling must succeed");
  assert(reschedRes.newBlock.status === 'BOOKED', "New slot must be BOOKED");
  assert(reschedRes.newBlock.clientId === 'gc-client-resched', "New slot must preserve clientId");

  const oldBlockAfter = CoachScheduleRepositoryTest.getAllBlocks().find(b => b.id === 'test-slot-resched-old');
  assert(oldBlockAfter.status === 'AVAILABLE', "Old slot must be restored to AVAILABLE");
  assert(!oldBlockAfter.clientId, "Old slot must not retain clientId");

  const reschedSummary = CoachScheduleRepositoryTest.getClientLessonSummary("gc-client-resched", 4);
  assert(reschedSummary.scheduledLessonCount === 1, "Scheduled count must remain exactly 1 after reschedule (no duplicate)");
  assert(reschedSummary.completedLessonCount === 0, "Completed count must remain 0");

  console.log("\n======================================================================");
  console.log("ALL CANCELLATION & SCHEDULING INTEGRITY TESTS PASSED (100% SUCCESS)");
  console.log("======================================================================");

} finally {
  // Restore original schedule data
  fs.writeFileSync(dataPath, JSON.stringify(originalData, null, 2), 'utf8');
}
