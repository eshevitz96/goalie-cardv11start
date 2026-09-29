/**
 * COACH SCHEDULE REPOSITORY
 * Version: 2026-09-29
 *
 * Requirements & Invariants:
 * 1. All Coach Card entries have participantRole = 'COACH'.
 * 2. Visual & Semantic Statuses: AVAILABLE, BOOKED, COMPLETED, CANCELED.
 * 3. Availability is schedule inventory, not an event that occurred.
 * 4. Open availability blocks do NOT have/require a client.
 * 5. Booked lessons contain date, start time, client, location, status, participantRole = 'COACH'.
 * 6. Status transitions: AVAILABLE -> BOOKED -> COMPLETED / CANCELED (provenance preserved).
 * 7. Coach Card schedule events MUST NEVER alter Elliott's athlete training calculations or nextPerformance.
 */

import fs from 'fs';
import path from 'path';
import { CoachScheduleBlock, CoachSlotStatus } from './types';

export class CoachScheduleRepository {
  private static getFilePath(): string {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {}
    }
    return path.join(dataDir, 'coach-schedule-local.json');
  }

  /**
   * Reads all Coach Card schedule blocks from local store.
   */
  static getAllBlocks(): CoachScheduleBlock[] {
    try {
      const filePath = this.getFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as CoachScheduleBlock[];
        return parsed.map(b => ({
          ...b,
          participantRole: 'COACH' // Invariant: always COACH
        }));
      }
    } catch (e) {
      console.warn("[CoachScheduleRepository Read Error]:", e);
    }
    return [];
  }

  /**
   * Writes coach schedule blocks back to persistent storage.
   */
  static saveBlocks(blocks: CoachScheduleBlock[]): boolean {
    try {
      const filePath = this.getFilePath();
      const sanitized = blocks.map(b => ({
        ...b,
        participantRole: 'COACH' // Invariant: always COACH
      }));
      fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.warn("[CoachScheduleRepository Write Error]:", e);
      return false;
    }
  }

  /**
   * Query blocks for a specific date range or filter.
   */
  static getSchedule(options?: {
    startDate?: string;
    endDate?: string;
    status?: CoachSlotStatus;
    location?: string;
  }): CoachScheduleBlock[] {
    const all = this.getAllBlocks();
    return all.filter(block => {
      if (options?.startDate && block.date < options.startDate) return false;
      if (options?.endDate && block.date > options.endDate) return false;
      if (options?.status && block.status !== options.status) return false;
      if (options?.location && !block.location.toLowerCase().includes(options.location.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Helper to parse date and time into canonical ISO timestamp (America/New_York)
   */
  static parseScheduledStartAt(dateStr: string, timeStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const match = (timeStr || '').match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    let hour = match ? parseInt(match[1], 10) : 12;
    const minute = match && match[2] ? parseInt(match[2], 10) : 0;
    const isPM = match && match[3] ? match[3].toUpperCase() === 'PM' : false;
    const isAM = match && match[3] ? match[3].toUpperCase() === 'AM' : false;

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const pad = (n: number) => String(n).padStart(2, '0');
    // Default New York offset during in-season is EDT (-04:00)
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-04:00`;
  }

  /**
   * Books an open availability slot: AVAILABLE -> BOOKED.
   */
  static bookSlot(
    slotId: string, 
    clientName: string, 
    options?: { clientId?: string; lessonId?: string; lessonCode?: string; notes?: string }
  ): { success: boolean; block?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    if (current.status !== 'AVAILABLE') {
      return { success: false, error: `Slot is not in AVAILABLE state (currently ${current.status}).` };
    }

    const scheduledStartAt = current.scheduledStartAt || this.parseScheduledStartAt(current.date, current.startTime);

    const updated: CoachScheduleBlock = {
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

  /**
   * Completes a booked lesson: BOOKED -> COMPLETED.
   * Invariant: Idempotent. Increments completed count exactly once.
   */
  static completeLesson(slotId: string, takeaways?: string): { success: boolean; block?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    if (current.status === 'COMPLETED') {
      // Idempotent: already completed
      return { success: true, block: current };
    }

    if (current.status !== 'BOOKED') {
      return { success: false, error: `Slot must be in BOOKED status to complete (currently ${current.status}).` };
    }

    const updated: CoachScheduleBlock = {
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

  /**
   * Cancels a booked lesson according to the 24-hour business policy:
   * - Notice >= 24h: CANCELED_NO_CHARGE (consumesLessonCredit = false)
   * - Notice < 24h: CANCELED_LATE_CHARGE (consumesLessonCredit = true)
   * Invariant: Idempotent. Cannot consume two credits on repeated cancellation calls.
   */
  static cancelLesson(
    slotId: string, 
    options?: { canceledAt?: string; reason?: string }
  ): { success: boolean; block?: CoachScheduleBlock; error?: string; alreadyCanceled?: boolean } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    
    // Idempotency check: if already canceled, do not re-cancel or double charge
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

    // 24 hours = 1440 minutes
    const isEarly = noticeMinutes >= 1440;
    const finalStatus: CoachSlotStatus = isEarly ? 'CANCELED_NO_CHARGE' : 'CANCELED_LATE_CHARGE';
    const consumesCredit = !isEarly;

    const noticeDescription = isEarly
      ? `Early cancellation (${(noticeMinutes / 60).toFixed(1)}h notice >= 24h) - No Credit Charged`
      : `Late cancellation (${(noticeMinutes / 60).toFixed(1)}h notice < 24h) - 1 Lesson Credit Charged`;

    const updated: CoachScheduleBlock = {
      ...current,
      status: finalStatus,
      previousStatus: current.status,
      scheduledStartAt,
      canceledAt,
      cancellationNoticeMinutes: noticeMinutes,
      cancellationClassification: finalStatus as any,
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

  /**
   * Reschedules a lesson to a new slot.
   * Invariant: Preserves client ID and lesson history without creating duplicate counts.
   */
  static rescheduleLesson(
    oldSlotId: string, 
    newSlotId: string
  ): { success: boolean; newBlock?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const oldIdx = blocks.findIndex(b => b.id === oldSlotId);
    const newIdx = blocks.findIndex(b => b.id === newSlotId);

    if (oldIdx === -1) return { success: false, error: `Original slot ${oldSlotId} not found.` };
    if (newIdx === -1) return { success: false, error: `Target slot ${newSlotId} not found.` };

    const oldBlock = blocks[oldIdx];
    const newBlock = blocks[newIdx];

    if (newBlock.status !== 'AVAILABLE') {
      return { success: false, error: `Target slot ${newSlotId} is not AVAILABLE (status: ${newBlock.status}).` };
    }

    const scheduledStartAt = newBlock.scheduledStartAt || this.parseScheduledStartAt(newBlock.date, newBlock.startTime);

    // Reopen old slot as AVAILABLE
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

    // Assign to new slot
    const updatedNew: CoachScheduleBlock = {
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

  /**
   * Returns complete relational lesson accounting for a specific client.
   * Separately derives:
   * - completedLessonCount: actual completed training sessions
   * - scheduledLessonCount: upcoming booked sessions
   * - chargedLessonCount / consumedLessonCredits: completed + late cancellations
   * - remainingLessonCredits: package allowance - consumed
   */
  static getClientLessonSummary(
    clientIdOrName: string, 
    totalPackageAllowance?: number
  ): {
    clientId?: string;
    clientName: string;
    completedLessonCount: number;
    scheduledLessonCount: number;
    chargedLessonCount: number;
    consumedLessonCredits: number;
    lateCanceledCount: number;
    earlyCanceledCount: number;
    remainingLessonCredits: number | null;
    lessons: CoachScheduleBlock[];
  } {
    const all = this.getAllBlocks();
    const query = clientIdOrName.toLowerCase().trim();

    const clientBlocks = all.filter(b => {
      if (b.clientId && b.clientId.toLowerCase() === query) return true;
      if (b.client && b.client.toLowerCase().includes(query)) return true;
      return false;
    });

    const completedLessonCount = clientBlocks.filter(b => b.status === 'COMPLETED').length;
    const scheduledLessonCount = clientBlocks.filter(b => b.status === 'BOOKED').length;
    
    // Late cancellations consume credit; early cancellations do NOT
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

    const primaryClient = clientBlocks.find(b => b.client)?.client || clientIdOrName;
    const canonicalClientId = clientBlocks.find(b => b.clientId)?.clientId;

    return {
      clientId: canonicalClientId,
      clientName: primaryClient,
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

