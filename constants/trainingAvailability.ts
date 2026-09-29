export interface TrainingSlot {
    id: string;
    date: string;          // ISO Date string: 'YYYY-MM-DD'
    startTime: string;     // e.g. '3:00 PM'
    endTime: string;       // e.g. '4:00 PM'
    timeDisplay: string;   // e.g. '3:00 PM – 4:00 PM'
    location: string;      // e.g. 'Bell Memorial Park'
    maxCapacity: number;   // 1 for 1-on-1 private training
    status?: 'AVAILABLE' | 'BOOKED' | 'COMPLETED' | 'CANCELED';
    client?: string;
    participantRole?: 'COACH';
}

/**
 * Standard weekly recurring schedule template:
 * - Tuesday: 5:00 PM, 6:00 PM @ Bell Memorial Park
 * - Wednesday: 4:00 PM, 5:00 PM, 6:00 PM @ Milton
 * - Thursday: 4:00 PM, 5:00 PM, 6:00 PM @ Milton
 * - Friday: 4:00 PM, 5:00 PM, 6:00 PM @ Lambert
 * - Saturday: 8:00 AM, 9:00 AM, 10:00 AM @ Bell Memorial Park
 * - Sunday: 9:00 AM, 10:00 AM @ Bell Memorial Park
 */
export const WEEKLY_COACH_SLOTS_SEPT29_OCT04: TrainingSlot[] = [
    // Tuesday Sept 29 — Bell
    { id: "coach-slot-2026-09-29-1700", date: "2026-09-29", startTime: "5:00 PM", endTime: "6:00 PM", timeDisplay: "5:00 PM – 6:00 PM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-09-29-1800", date: "2026-09-29", startTime: "6:00 PM", endTime: "7:00 PM", timeDisplay: "6:00 PM – 7:00 PM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    
    // Wednesday Sept 30 — Milton
    { id: "coach-slot-2026-09-30-1600", date: "2026-09-30", startTime: "4:00 PM", endTime: "5:00 PM", timeDisplay: "4:00 PM – 5:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-09-30-1700", date: "2026-09-30", startTime: "5:00 PM", endTime: "6:00 PM", timeDisplay: "5:00 PM – 6:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-09-30-1800", date: "2026-09-30", startTime: "6:00 PM", endTime: "7:00 PM", timeDisplay: "6:00 PM – 7:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    
    // Thursday Oct 1 — Milton
    { id: "coach-slot-2026-10-01-1600", date: "2026-10-01", startTime: "4:00 PM", endTime: "5:00 PM", timeDisplay: "4:00 PM – 5:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-10-01-1700", date: "2026-10-01", startTime: "5:00 PM", endTime: "6:00 PM", timeDisplay: "5:00 PM – 6:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-10-01-1800", date: "2026-10-01", startTime: "6:00 PM", endTime: "7:00 PM", timeDisplay: "6:00 PM – 7:00 PM", location: "Milton", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    
    // Friday Oct 2 — Lambert
    { id: "coach-slot-2026-10-02-1600", date: "2026-10-02", startTime: "4:00 PM", endTime: "5:00 PM", timeDisplay: "4:00 PM – 5:00 PM", location: "Lambert", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-10-02-1700", date: "2026-10-02", startTime: "5:00 PM", endTime: "6:00 PM", timeDisplay: "5:00 PM – 6:00 PM", location: "Lambert", maxCapacity: 1, status: "BOOKED", client: "C. Gethers", participantRole: "COACH" },
    { id: "coach-slot-2026-10-02-1800", date: "2026-10-02", startTime: "6:00 PM", endTime: "7:00 PM", timeDisplay: "6:00 PM – 7:00 PM", location: "Lambert", maxCapacity: 1, status: "BOOKED", client: "H. Cortjens", participantRole: "COACH" },
    
    // Saturday Oct 3 — Bell
    { id: "coach-slot-2026-10-03-0800", date: "2026-10-03", startTime: "8:00 AM", endTime: "9:00 AM", timeDisplay: "8:00 AM – 9:00 AM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-10-03-0900", date: "2026-10-03", startTime: "9:00 AM", endTime: "10:00 AM", timeDisplay: "9:00 AM – 10:00 AM", location: "Bell Memorial Park", maxCapacity: 1, status: "BOOKED", client: "B. Gebhardt", participantRole: "COACH" },
    { id: "coach-slot-2026-10-03-1000", date: "2026-10-03", startTime: "10:00 AM", endTime: "11:00 AM", timeDisplay: "10:00 AM – 11:00 AM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    
    // Sunday Oct 4 — Bell
    { id: "coach-slot-2026-10-04-0900", date: "2026-10-04", startTime: "9:00 AM", endTime: "10:00 AM", timeDisplay: "9:00 AM – 10:00 AM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" },
    { id: "coach-slot-2026-10-04-1000", date: "2026-10-04", startTime: "10:00 AM", endTime: "11:00 AM", timeDisplay: "10:00 AM – 11:00 AM", location: "Bell Memorial Park", maxCapacity: 1, status: "AVAILABLE", participantRole: "COACH" }
];

const WEEKLY_TEMPLATE = [
    // Tuesday (2)
    { dayOfWeek: 2, startTime: '5:00 PM', endTime: '6:00 PM', timeDisplay: '5:00 PM – 6:00 PM', location: 'Bell Memorial Park' },
    { dayOfWeek: 2, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Bell Memorial Park' },
    
    // Wednesday (3)
    { dayOfWeek: 3, startTime: '4:00 PM', endTime: '5:00 PM', timeDisplay: '4:00 PM – 5:00 PM', location: 'Milton' },
    { dayOfWeek: 3, startTime: '5:00 PM', endTime: '6:00 PM', timeDisplay: '5:00 PM – 6:00 PM', location: 'Milton' },
    { dayOfWeek: 3, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Milton' },
    
    // Thursday (4)
    { dayOfWeek: 4, startTime: '4:00 PM', endTime: '5:00 PM', timeDisplay: '4:00 PM – 5:00 PM', location: 'Milton' },
    { dayOfWeek: 4, startTime: '5:00 PM', endTime: '6:00 PM', timeDisplay: '5:00 PM – 6:00 PM', location: 'Milton' },
    { dayOfWeek: 4, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Milton' },
    
    // Friday (5)
    { dayOfWeek: 5, startTime: '4:00 PM', endTime: '5:00 PM', timeDisplay: '4:00 PM – 5:00 PM', location: 'Lambert' },
    { dayOfWeek: 5, startTime: '5:00 PM', endTime: '6:00 PM', timeDisplay: '5:00 PM – 6:00 PM', location: 'Lambert' },
    { dayOfWeek: 5, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Lambert' },
    
    // Saturday (6)
    { dayOfWeek: 6, startTime: '8:00 AM', endTime: '9:00 AM', timeDisplay: '8:00 AM – 9:00 AM', location: 'Bell Memorial Park' },
    { dayOfWeek: 6, startTime: '9:00 AM', endTime: '10:00 AM', timeDisplay: '9:00 AM – 10:00 AM', location: 'Bell Memorial Park' },
    { dayOfWeek: 6, startTime: '10:00 AM', endTime: '11:00 AM', timeDisplay: '10:00 AM – 11:00 AM', location: 'Bell Memorial Park' },
    
    // Sunday (0)
    { dayOfWeek: 0, startTime: '9:00 AM', endTime: '10:00 AM', timeDisplay: '9:00 AM – 10:00 AM', location: 'Bell Memorial Park' },
    { dayOfWeek: 0, startTime: '10:00 AM', endTime: '11:00 AM', timeDisplay: '10:00 AM – 11:00 AM', location: 'Bell Memorial Park' }
];

/**
 * Generates slots for a given date range
 */
export function generateTrainingSlots(startDate: Date, endDate: Date): TrainingSlot[] {
    const slots: TrainingSlot[] = [];
    const curr = new Date(startDate);
    curr.setHours(12, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(12, 0, 0, 0);

    const pad = (n: number) => String(n).padStart(2, '0');

    while (curr <= end) {
        const dayOfWeek = curr.getDay();
        const year = curr.getFullYear();
        const month = pad(curr.getMonth() + 1);
        const day = pad(curr.getDate());
        const dateStr = `${year}-${month}-${day}`;

        // Check if explicit slot is defined for this date
        const explicitSlots = WEEKLY_COACH_SLOTS_SEPT29_OCT04.filter(s => s.date === dateStr);
        if (explicitSlots.length > 0) {
            slots.push(...explicitSlots);
        } else {
            const dayTemplates = WEEKLY_TEMPLATE.filter(t => t.dayOfWeek === dayOfWeek);
            for (const t of dayTemplates) {
                const timeSlug = t.startTime.replace(/[^0-9]/g, '').padStart(4, '0');
                const id = `slot-${dateStr}-${timeSlug}`;
                slots.push({
                    id,
                    date: dateStr,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    timeDisplay: t.timeDisplay,
                    location: t.location,
                    maxCapacity: 1,
                    status: 'AVAILABLE',
                    participantRole: 'COACH'
                });
            }
        }

        curr.setDate(curr.getDate() + 1);
    }

    return slots;
}

// Pre-generate slots starting from Sep 14, 2026 through Dec 31, 2026
export const INITIAL_TRAINING_SLOTS: TrainingSlot[] = generateTrainingSlots(
    new Date(2026, 8, 14), // Sep 14, 2026
    new Date(2026, 11, 31) // Dec 31, 2026
);
