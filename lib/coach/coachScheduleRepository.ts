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
   * Books an open availability slot: AVAILABLE -> BOOKED.
   */
  static bookSlot(slotId: string, clientName: string, notes?: string): { success: boolean; block?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    if (current.status !== 'AVAILABLE') {
      return { success: false, error: `Slot is not in AVAILABLE state (currently ${current.status}).` };
    }

    const updated: CoachScheduleBlock = {
      ...current,
      status: 'BOOKED',
      client: clientName.trim(),
      notes: notes || `Private Lacrosse Goalie Lesson - ${clientName.trim()}`,
      previousStatus: 'AVAILABLE',
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  /**
   * Completes a booked lesson: BOOKED -> COMPLETED.
   */
  static completeLesson(slotId: string, takeaways?: string): { success: boolean; block?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    if (current.status !== 'BOOKED') {
      return { success: false, error: `Slot must be in BOOKED status to complete (currently ${current.status}).` };
    }

    const updated: CoachScheduleBlock = {
      ...current,
      status: 'COMPLETED',
      previousStatus: 'BOOKED',
      notes: takeaways ? `${current.notes || ''} [Takeaways: ${takeaways}]` : current.notes,
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  /**
   * Cancels a booked lesson: BOOKED -> CANCELED.
   */
  static cancelLesson(slotId: string, reason?: string): { success: boolean; block?: CoachScheduleBlock; error?: string } {
    const blocks = this.getAllBlocks();
    const idx = blocks.findIndex(b => b.id === slotId);
    if (idx === -1) {
      return { success: false, error: `Slot ${slotId} not found.` };
    }

    const current = blocks[idx];
    if (current.status !== 'BOOKED' && current.status !== 'AVAILABLE') {
      return { success: false, error: `Slot cannot be canceled from status ${current.status}.` };
    }

    const updated: CoachScheduleBlock = {
      ...current,
      status: 'CANCELED',
      previousStatus: current.status,
      notes: reason ? `${current.notes || ''} [Canceled: ${reason}]` : current.notes,
      updatedAt: new Date().toISOString()
    };

    blocks[idx] = updated;
    this.saveBlocks(blocks);
    return { success: true, block: updated };
  }

  /**
   * Returns all booked/delivered/canceled lessons for a specific client.
   * Invariant: Canceled lessons still count toward the package lesson count (e.g. S25 L3).
   */
  static getClientLessonSummary(clientName: string): {
    totalConsumed: number;
    completedCount: number;
    canceledCount: number;
    bookedCount: number;
    lessons: CoachScheduleBlock[];
  } {
    const all = this.getAllBlocks();
    const clientBlocks = all.filter(b => 
      b.client && b.client.toLowerCase().includes(clientName.toLowerCase().trim())
    );

    const completedCount = clientBlocks.filter(b => b.status === 'COMPLETED').length;
    const canceledCount = clientBlocks.filter(b => b.status === 'CANCELED').length;
    const bookedCount = clientBlocks.filter(b => b.status === 'BOOKED').length;

    return {
      totalConsumed: completedCount + canceledCount, // Both completed and canceled lessons consume package count
      completedCount,
      canceledCount,
      bookedCount,
      lessons: clientBlocks
    };
  }
}

