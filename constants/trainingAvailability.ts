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
 * Pre-configured training slots for the upcoming weeks.
 * - Wednesday: 3:00 PM, 4:00 PM @ Bell Memorial Park
 * - Thursday: 6:00 PM, 7:00 PM @ Milton
 * - Friday: 6:00 PM, 7:00 PM @ Lambert
 * - Saturday Morning: 9:00 AM, 10:00 AM @ Milton
 * - Saturday Evening: 6:00 PM, 7:00 PM @ Lambert
 * - Sunday Morning: 10:00 AM, 11:00 AM @ Lambert
 */
export const INITIAL_TRAINING_SLOTS: TrainingSlot[] = [
    // ── Week 1 (Sep 9 – Sep 13, 2026) ─────────────────────────
    {
        id: 'slot-2026-09-09-1500',
        date: '2026-09-09',
        startTime: '3:00 PM',
        endTime: '4:00 PM',
        timeDisplay: '3:00 PM – 4:00 PM',
        location: 'Bell Memorial Park',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-09-1600',
        date: '2026-09-09',
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        timeDisplay: '4:00 PM – 5:00 PM',
        location: 'Bell Memorial Park',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-10-1800',
        date: '2026-09-10',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-10-1900',
        date: '2026-09-10',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-11-1800',
        date: '2026-09-11',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-11-1900',
        date: '2026-09-11',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-12-0900',
        date: '2026-09-12',
        startTime: '9:00 AM',
        endTime: '10:00 AM',
        timeDisplay: '9:00 AM – 10:00 AM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-12-1000',
        date: '2026-09-12',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        timeDisplay: '10:00 AM – 11:00 AM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-12-1800',
        date: '2026-09-12',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-12-1900',
        date: '2026-09-12',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-13-1000',
        date: '2026-09-13',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        timeDisplay: '10:00 AM – 11:00 AM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-13-1100',
        date: '2026-09-13',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        timeDisplay: '11:00 AM – 12:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },

    // ── Week 2 (Sep 16 – Sep 20, 2026) ────────────────────────
    {
        id: 'slot-2026-09-16-1500',
        date: '2026-09-16',
        startTime: '3:00 PM',
        endTime: '4:00 PM',
        timeDisplay: '3:00 PM – 4:00 PM',
        location: 'Bell Memorial Park',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-16-1600',
        date: '2026-09-16',
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        timeDisplay: '4:00 PM – 5:00 PM',
        location: 'Bell Memorial Park',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-17-1800',
        date: '2026-09-17',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-17-1900',
        date: '2026-09-17',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-18-1800',
        date: '2026-09-18',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-18-1900',
        date: '2026-09-18',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-19-0900',
        date: '2026-09-19',
        startTime: '9:00 AM',
        endTime: '10:00 AM',
        timeDisplay: '9:00 AM – 10:00 AM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-19-1000',
        date: '2026-09-19',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        timeDisplay: '10:00 AM – 11:00 AM',
        location: 'Milton',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-19-1800',
        date: '2026-09-19',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        timeDisplay: '6:00 PM – 7:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-19-1900',
        date: '2026-09-19',
        startTime: '7:00 PM',
        endTime: '8:00 PM',
        timeDisplay: '7:00 PM – 8:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-20-1000',
        date: '2026-09-20',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        timeDisplay: '10:00 AM – 11:00 AM',
        location: 'Lambert',
        maxCapacity: 1
    },
    {
        id: 'slot-2026-09-20-1100',
        date: '2026-09-20',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        timeDisplay: '11:00 AM – 12:00 PM',
        location: 'Lambert',
        maxCapacity: 1
    }
];
