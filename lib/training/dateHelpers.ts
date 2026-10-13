/**
 * Plain calendar date utilities that operate strictly on YYYY-MM-DD calendar strings
 * and integer date parts (year, month, day) without ever using new Date(dateStr),
 * .toISOString(), or UTC midnight conversion.
 */

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const WEEKDAYS_NARROW = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
] as const;

export type WeekdayName = typeof WEEKDAYS[number];

export interface CalendarDateParts {
    year: number;
    month: number; // 1-12
    day: number;   // 1-31
}

export interface CalendarDateFormatOptions {
    weekday?: 'short' | 'long' | 'narrow';
    month?: 'short' | 'long' | 'numeric' | '2-digit';
    day?: 'numeric' | '2-digit';
    year?: 'numeric';
}

const MONTH_NAME_MAP: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
};

/**
 * Extracts plain { year, month, day } integers from a date string or local Date object
 * without any UTC midnight shift.
 */
export function extractCalendarDateParts(input: string | Date | null | undefined): CalendarDateParts | null {
    if (!input) return null;

    if (input instanceof Date) {
        if (isNaN(input.getTime())) return null;
        return {
            year: input.getFullYear(),
            month: input.getMonth() + 1,
            day: input.getDate()
        };
    }

    const str = String(input).trim();
    if (!str) return null;

    // 1. YYYY-MM-DD (or ISO string starting with YYYY-MM-DD)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { year, month, day };
        }
    }

    // 2. MM/DD/YYYY
    const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const year = Number(slashMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { year, month, day };
        }
    }

    // 3. Named month e.g. "Jul 29, 2026" or "July 29 2026"
    const namedMatch = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (namedMatch) {
        const month = MONTH_NAME_MAP[namedMatch[1].toLowerCase()];
        const day = Number(namedMatch[2]);
        const year = Number(namedMatch[3]);
        if (month && day >= 1 && day <= 31) {
            return { year, month, day };
        }
    }

    return null;
}

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
 * Converts a Date or date string into a plain YYYY-MM-DD string without UTC conversion.
 * Defaults to today if input is omitted.
 */
export function toCalendarDateString(input?: string | Date | null): string {
    if (!input) return getTodayDateString();
    const parts = extractCalendarDateParts(input);
    if (!parts) return getTodayDateString();
    const y = String(parts.year).padStart(4, '0');
    const m = String(parts.month).padStart(2, '0');
    const d = String(parts.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Converts a plain calendar date string into a local Date at local midnight (new Date(y, m - 1, d)).
 * Only for UI components that require a local Date instance.
 */
export function calendarDateToLocalDate(input: string | Date): Date {
    const parts = extractCalendarDateParts(input) || extractCalendarDateParts(getTodayDateString())!;
    return new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
}

/**
 * Pure integer Julian Day Number from calendar { year, month, day }.
 */
function toJulianDayNumber(year: number, month: number, day: number): number {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return (
        day +
        Math.floor((153 * m + 2) / 5) +
        365 * y +
        Math.floor(y / 4) -
        Math.floor(y / 100) +
        Math.floor(y / 400) -
        32045
    );
}

/**
 * Pure integer calendar { year, month, day } from Julian Day Number.
 */
function fromJulianDayNumber(jdn: number): CalendarDateParts {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    return { year, month, day };
}

/**
 * Pure integer day-of-week index (0 = Sunday .. 6 = Saturday) using Sakamoto's algorithm.
 */
export function getWeekdayIndex(dateInput: string | Date): number {
    const parts = extractCalendarDateParts(dateInput);
    if (!parts) return 0;
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let y = parts.year;
    if (parts.month < 3) y -= 1;
    return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[parts.month - 1] + parts.day) % 7;
}

/**
 * Returns 0-indexed Monday-based weekday index (0 = Monday .. 6 = Sunday).
 */
export function getMondayBasedWeekdayIndex(dateInput: string | Date): number {
    const w = getWeekdayIndex(dateInput);
    return w === 0 ? 6 : w - 1;
}

/**
 * Returns the 3-letter weekday ("Sun", "Mon", "Tue", etc.) for a YYYY-MM-DD string.
 */
export function getWeekdayFromDateString(dateStr: string): WeekdayName {
    return WEEKDAYS[getWeekdayIndex(dateStr)];
}

/**
 * Safely adds days to a calendar date using pure integer Julian Day math (no Date/UTC conversion).
 */
export function addDaysToDateString(baseDateInput: string | Date, daysToAdd: number): string {
    const parts = extractCalendarDateParts(baseDateInput);
    if (!parts) return getTodayDateString();
    const jdn = toJulianDayNumber(parts.year, parts.month, parts.day) + Math.round(daysToAdd);
    const next = fromJulianDayNumber(jdn);
    const y = String(next.year).padStart(4, '0');
    const m = String(next.month).padStart(2, '0');
    const d = String(next.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday YYYY-MM-DD of the week containing baseDateInput (defaults to today).
 */
export function getMondayDateString(baseDateInput?: string | Date): string {
    const baseStr = toCalendarDateString(baseDateInput);
    const daysSinceMon = getMondayBasedWeekdayIndex(baseStr);
    return addDaysToDateString(baseStr, -daysSinceMon);
}

/**
 * Returns signed number of calendar days from startInput to endInput (end - start).
 */
export function daysBetweenCalendarDates(
    startInput: string | Date | null | undefined,
    endInput: string | Date | null | undefined
): number {
    const s = extractCalendarDateParts(startInput);
    const e = extractCalendarDateParts(endInput);
    if (!s || !e) return 0;
    return toJulianDayNumber(e.year, e.month, e.day) - toJulianDayNumber(s.year, s.month, s.day);
}

/**
 * Compares two calendar dates (-1 if a < b, 0 if same calendar day, 1 if a > b).
 */
export function compareCalendarDates(
    a: string | Date | null | undefined,
    b: string | Date | null | undefined
): number {
    const diff = daysBetweenCalendarDates(b, a);
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
}

/**
 * Formats a calendar date (YYYY-MM-DD, ISO string, or Date) as a human-readable string
 * using pure string lookup tables (never new Date(dateStr) or UTC conversion).
 *
 * Default format: "Jul 29, 2026"
 */
export function formatCalendarDate(
    dateInput: string | Date | null | undefined,
    options?: CalendarDateFormatOptions
): string {
    const parts = extractCalendarDateParts(dateInput);
    if (!parts) return "";

    const opts: CalendarDateFormatOptions = options || {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    const { year, month, day } = parts;
    const weekdayIdx = getWeekdayIndex(parts ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '');

    let weekdayStr = "";
    if (opts.weekday === 'long') weekdayStr = WEEKDAYS_LONG[weekdayIdx];
    else if (opts.weekday === 'short') weekdayStr = WEEKDAYS[weekdayIdx];
    else if (opts.weekday === 'narrow') weekdayStr = WEEKDAYS_NARROW[weekdayIdx];

    let monthStr = "";
    if (opts.month === 'long') monthStr = MONTHS_LONG[month - 1];
    else if (opts.month === 'short') monthStr = MONTHS_SHORT[month - 1];
    else if (opts.month === '2-digit') monthStr = String(month).padStart(2, '0');
    else if (opts.month === 'numeric') monthStr = String(month);

    let dayStr = "";
    if (opts.day === '2-digit') dayStr = String(day).padStart(2, '0');
    else if (opts.day === 'numeric') dayStr = String(day);

    const yearStr = opts.year === 'numeric' ? String(year) : "";

    // Numeric slash format e.g. 7/29/2026
    if ((opts.month === 'numeric' || opts.month === '2-digit') && dayStr) {
        const slashDate = yearStr ? `${monthStr}/${dayStr}/${yearStr}` : `${monthStr}/${dayStr}`;
        return weekdayStr ? `${weekdayStr}, ${slashDate}` : slashDate;
    }

    // Month + Year only e.g. "July 2026"
    if (monthStr && !dayStr && yearStr) {
        return `${monthStr} ${yearStr}`;
    }

    // Month + Day (+ optional Year) e.g. "Jul 29" or "Jul 29, 2026"
    let dateCore = "";
    if (monthStr && dayStr) {
        dateCore = `${monthStr} ${dayStr}`;
        if (yearStr) {
            dateCore += `, ${yearStr}`;
        }
    } else if (monthStr) {
        dateCore = monthStr;
    } else if (dayStr) {
        dateCore = dayStr;
    } else if (yearStr) {
        dateCore = yearStr;
    }

    if (weekdayStr && dateCore) {
        return `${weekdayStr}, ${dateCore}`;
    }
    return weekdayStr || dateCore;
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
    const diffDays = daysBetweenCalendarDates(startDateStr, targetDateStr) + 1;
    const fullWeeks = Math.floor(diffDays / 7);
    return Math.max(2, Math.min(4, fullWeeks));
}
