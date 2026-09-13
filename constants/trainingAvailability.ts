export interface TrainingSlot {
    id: string;
    date: string;          // ISO Date string: 'YYYY-MM-DD'
    startTime: string;     // e.g. '3:00 PM'
    endTime: string;       // e.g. '4:00 PM'
    timeDisplay: string;   // e.g. '3:00 PM – 4:00 PM'
    location: string;      // e.g. 'Bell Memorial Park'
    maxCapacity: number;   // 1 for 1-on-1 private training
}

/**
 * Standard weekly recurring schedule template:
 * - Wednesday (Day 3): 3:00 PM – 4:00 PM, 4:00 PM – 5:00 PM @ Bell Memorial Park
 * - Thursday (Day 4): 6:00 PM – 7:00 PM, 7:00 PM – 8:00 PM @ Milton
 * - Friday (Day 5): 6:00 PM – 7:00 PM, 7:00 PM – 8:00 PM @ Lambert
 * - Saturday Morning (Day 6): 9:00 AM – 10:00 AM, 10:00 AM – 11:00 AM @ Milton
 * - Saturday Evening (Day 6): 6:00 PM – 7:00 PM, 7:00 PM – 8:00 PM @ Lambert
 * - Sunday Morning (Day 0): 10:00 AM – 11:00 AM, 11:00 AM – 12:00 PM @ Lambert
 */
const WEEKLY_TEMPLATE = [
    // Wednesday (3)
    { dayOfWeek: 3, startTime: '3:00 PM', endTime: '4:00 PM', timeDisplay: '3:00 PM – 4:00 PM', location: 'Bell Memorial Park' },
    { dayOfWeek: 3, startTime: '4:00 PM', endTime: '5:00 PM', timeDisplay: '4:00 PM – 5:00 PM', location: 'Bell Memorial Park' },
    { dayOfWeek: 3, startTime: '5:00 PM', endTime: '6:00 PM', timeDisplay: '5:00 PM – 6:00 PM', location: 'Bell Memorial Park' },
    
    // Thursday (4)
    { dayOfWeek: 4, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Milton' },
    { dayOfWeek: 4, startTime: '7:00 PM', endTime: '8:00 PM', timeDisplay: '7:00 PM – 8:00 PM', location: 'Milton' },
    
    // Friday (5)
    { dayOfWeek: 5, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Lambert' },
    { dayOfWeek: 5, startTime: '7:00 PM', endTime: '8:00 PM', timeDisplay: '7:00 PM – 8:00 PM', location: 'Lambert' },
    
    // Saturday (6)
    { dayOfWeek: 6, startTime: '9:00 AM', endTime: '10:00 AM', timeDisplay: '9:00 AM – 10:00 AM', location: 'Milton' },
    { dayOfWeek: 6, startTime: '10:00 AM', endTime: '11:00 AM', timeDisplay: '10:00 AM – 11:00 AM', location: 'Milton' },
    { dayOfWeek: 6, startTime: '6:00 PM', endTime: '7:00 PM', timeDisplay: '6:00 PM – 7:00 PM', location: 'Lambert' },
    { dayOfWeek: 6, startTime: '7:00 PM', endTime: '8:00 PM', timeDisplay: '7:00 PM – 8:00 PM', location: 'Lambert' },
    
    // Sunday (0)
    { dayOfWeek: 0, startTime: '10:00 AM', endTime: '11:00 AM', timeDisplay: '10:00 AM – 11:00 AM', location: 'Lambert' },
    { dayOfWeek: 0, startTime: '11:00 AM', endTime: '12:00 PM', timeDisplay: '11:00 AM – 12:00 PM', location: 'Lambert' }
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
        const dayOfWeek = curr.getDay(); // 0 = Sun, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
        const year = curr.getFullYear();
        const month = pad(curr.getMonth() + 1);
        const day = pad(curr.getDate());
        const dateStr = `${year}-${month}-${day}`;

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
                maxCapacity: 1
            });
        }

        curr.setDate(curr.getDate() + 1);
    }

    return slots;
}

// Pre-generate slots starting from Sep 14, 2026 (omitting Sep 13) through Dec 31, 2026
export const INITIAL_TRAINING_SLOTS: TrainingSlot[] = generateTrainingSlots(
    new Date(2026, 8, 14), // Sep 14, 2026 (Starts Monday, no slots for Sep 13)
    new Date(2026, 11, 31) // Dec 31, 2026
);
