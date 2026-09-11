/**
 * RFC 5545 iCalendar (.ics) Generator
 * Formats training sessions and lessons into calendar events
 */

export interface ICalEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startDate: Date | string;
    endDate?: Date | string;
    athleteName?: string;
    athleteEmail?: string;
    coachEmail?: string;
    status?: string;
}

function formatDateToICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSString(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

export function generateICSFeed(events: ICalEvent[], calendarName = "GoalieCard - Coach Schedule"): string {
    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Goalie Card//CoachOS Calendar Engine//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${escapeICSString(calendarName)}`,
        "X-WR-TIMEZONE:America/New_York",
        "X-PUBLISHED-TTL:PT1H",
    ];

    events.forEach(evt => {
        const start = new Date(evt.startDate);
        if (isNaN(start.getTime())) return;

        // Default duration: 1 hour if not specified
        const end = evt.endDate ? new Date(evt.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        const now = new Date();

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:goaliecard-sess-${evt.id || Math.random().toString(36).substring(2)}@goaliecard.app`);
        lines.push(`DTSTAMP:${formatDateToICS(now)}`);
        lines.push(`DTSTART:${formatDateToICS(start)}`);
        lines.push(`DTEND:${formatDateToICS(end)}`);
        lines.push(`SUMMARY:${escapeICSString(evt.title)}`);

        if (evt.description) {
            lines.push(`DESCRIPTION:${escapeICSString(evt.description)}`);
        }

        if (evt.location) {
            lines.push(`LOCATION:${escapeICSString(evt.location)}`);
        }

        if (evt.coachEmail) {
            lines.push(`ORGANIZER;CN=Coach Elliott:mailto:${evt.coachEmail}`);
        }

        if (evt.athleteEmail) {
            lines.push(`ATTENDEE;CN=${escapeICSString(evt.athleteName || 'Athlete')}:mailto:${evt.athleteEmail}`);
        }

        lines.push(`STATUS:${evt.status?.toLowerCase().includes('complete') ? 'COMPLETED' : 'CONFIRMED'}`);
        lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");

    return lines.join("\r\n");
}
