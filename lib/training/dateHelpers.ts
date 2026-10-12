/**
 * Date manipulation utilities that operate on YYYY-MM-DD calendar strings
 * without timezone boundary skew.
 */

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type WeekdayName = typeof WEEKDAYS[number];

/**
 * Returns today's date formatted as YYYY-MM-DD in the athlete's timezone (defaults to America/New_York).
 */
export function getTodayDateString(timeZone: string = 'America/New_York'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(new Date());
}

/**
 * Parses YYYY-MM-DD to a UTC Date at noon to avoid daylight saving or midnight boundary issues.
 */
export function parseDateStringToNoonUtc(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Returns the 3-letter weekday ("Sun", "Mon", "Tue", etc.) for a YYYY-MM-DD string.
 */
export function getWeekdayFromDateString(dateStr: string): WeekdayName {
    const dt = parseDateStringToNoonUtc(dateStr);
    return WEEKDAYS[dt.getUTCDay()];
}

/**
 * Safely adds days to a YYYY-MM-DD date string without timezone skew.
 */
export function addDaysToDateString(baseDateStr: string, daysToAdd: number): string {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd, 12, 0, 0));
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Given a starting date, finds the upcoming date that falls on the desired target weekday.
 */
export function getDateForWeekday(baseDateStr: string, targetWeekday: WeekdayName, weekOffset: number = 0): string {
    const currentWeekday = getWeekdayFromDateString(baseDateStr);
    const dayMap: Record<WeekdayName, number> = {
        "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
    };
    const currentIdx = dayMap[currentWeekday];
    const targetIdx = dayMap[targetWeekday];
    const daysUntilTarget = ((targetIdx - currentIdx + 7) % 7) + (weekOffset * 7);
    return addDaysToDateString(baseDateStr, daysUntilTarget);
}

/**
 * Calculates number of full training weeks between a start date and target date.
 * Clamps between 2 and 4 weeks.
 */
export function calculatePlanWeeks(startDateStr: string, targetDateStr: string | null): number {
    if (!targetDateStr) return 4;
    const [sy, sm, sd] = startDateStr.split('-').map(Number);
    const [ty, tm, td] = targetDateStr.split('-').map(Number);
    const startMs = Date.UTC(sy, sm - 1, sd, 12, 0, 0);
    const targetMs = Date.UTC(ty, tm - 1, td, 12, 0, 0);
    const diffDays = Math.floor((targetMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const fullWeeks = Math.floor(diffDays / 7);
    return Math.max(2, Math.min(4, fullWeeks));
}
