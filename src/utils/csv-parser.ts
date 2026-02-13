
import { DEFAULT_GRAD_YEAR } from "@/constants/app-constants";
export interface ParsedRosterItem {
    email: string;
    goalie_name: string;
    parent_name: string;
    parent_phone: string;
    guardian_email?: string;
    guardian_phone?: string;
    athlete_email?: string;
    athlete_phone?: string;
    grad_year: number;
    team: string;
    assigned_unique_id?: string;
    session_count: number;
    lesson_count: number;
    is_claimed?: boolean;
    raw_data: Record<string, any>;
    _session_log?: {
        date: string | null;
        start_time: string | null;
        end_time: string | null;
        location: string;
        notes: string;
        session_number: number;
        lesson_number: number;
    };
}

export type UploadStatus = "idle" | "processing" | "success" | "error";

export const parseCsv = async (csvText: string, dbData: any[], targetGoalieId: string = ""): Promise<ParsedRosterItem[]> => {
    // Pre-process: Remove BOM if present
    csvText = csvText.replace(/^\uFEFF/, '');

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) {
        throw new Error("CSV is empty or invalid.");
    }

    // Helper to split CSV lines correctly (handling quotes)
    const splitLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Header Detection
    let headerRowIndex = 0;
    let map = {
        email: -1,
        firstName: -1,
        lastName: -1,
        fullName: -1,
        gradYear: -1,
        team: -1,
        school: -1,
        parentFirst: -1,
        parentLast: -1,
        parentName: -1,
        phone: -1,
        sessionCount: -1,
        lessonCount: -1,
        date: -1,
        startTime: -1,
        endTime: -1,
        location: -1,
        notes: -1,
        coach: -1
    };

    let rawHeaders: string[] = [];

    // Find the selected goalie object if any
    const targetGoalie = dbData.find(g => g.id === targetGoalieId);

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const row = splitLine(lines[i].toLowerCase());
        const isStandardHeader = row.some(c => c.includes('email') || c.includes('goalie'));
        const isDataHeader = targetGoalieId && row.some(c => c.includes('date') || c.includes('session') || c.includes('s#') || c.includes('notes'));

        if (isStandardHeader || isDataHeader) {
            headerRowIndex = i;
            rawHeaders = splitLine(lines[i]);
            const potentialHeaders = row;

            map = {
                email: potentialHeaders.findIndex(h => h === 'email' || h === 'parent email' || h.includes('email')),
                firstName: potentialHeaders.findIndex(h => h === 'first' || h.includes('first name') || h === 'goalie first'),
                lastName: potentialHeaders.findIndex(h => h === 'last' || h.includes('last name') || h === 'goalie last'),
                fullName: potentialHeaders.findIndex(h => h === 'name' || h === 'goalie' || h === 'goalie name' || h === 'player'),
                gradYear: potentialHeaders.findIndex(h => h.includes('year') || h.includes('grad') || h.includes('dob') || h.includes('birth')),
                team: potentialHeaders.findIndex(h => h.includes('team') || h.includes('club')),
                school: potentialHeaders.findIndex(h => h.includes('school')),
                parentFirst: potentialHeaders.findIndex(h => h.includes('parent first') || h.includes('mom') || h.includes('dad')),
                parentLast: potentialHeaders.findIndex(h => h.includes('parent last')),
                parentName: potentialHeaders.findIndex(h => h.includes('parent') && !h.includes('email') && !h.includes('phone')),
                phone: potentialHeaders.findIndex(h => h.includes('phone') || h.includes('cell') || h.includes('mobile')),

                sessionCount: potentialHeaders.findIndex(h => h === 's#' || h === 'session' || h.includes('session number') || h.includes('session #') || (h.includes('session') && (h.includes('count') || h.includes('completed') || h.includes('#')))),
                lessonCount: potentialHeaders.findIndex(h => h === 'l#' || h === 'lesson' || h.includes('lesson number') || h.includes('lesson #') || (h.includes('lesson') && (h.includes('count') || h.includes('completed') || h.includes('#')))),

                date: potentialHeaders.findIndex(h => h.includes('date') || h.includes('start datetime')),
                startTime: potentialHeaders.findIndex(h => (h.includes('start') && (h.includes('time') || h.includes('datetime')))),
                endTime: potentialHeaders.findIndex(h => (h.includes('end') && (h.includes('time') || h.includes('datetime')))),
                location: potentialHeaders.findIndex(h => h.includes('location') || h.includes('rink') || h.includes('venue')),
                notes: potentialHeaders.findIndex(h => h.includes('notes') || h.includes('comments') || h.includes('raw summary')),
                coach: potentialHeaders.findIndex(h => h.includes('coach') || h.includes('instructor'))
            };

            if (map.email === -1 && !targetGoalie) {
                throw new Error(`Error: Could not find an 'Email' column in the CSV.\n\nHeaders Found: ${potentialHeaders.join(', ')}\n\nEither add an 'Email' column OR select a 'Target Goalie' to force-assign.`);
            }
            break;
        }
    }

    // Defaults
    if (map.firstName === -1 && map.fullName === -1) map.firstName = 1;
    if (map.lastName === -1 && map.fullName === -1) map.lastName = 2;

    const parsedItems: ParsedRosterItem[] = lines.slice(headerRowIndex + 1).map((line, idx): ParsedRosterItem | null => {
        if (line.length > 500 || line.includes("https://") || line.toLowerCase().includes("leave blank")) return null;
        const values = splitLine(line);

        // Capture Raw Data
        const rawData: Record<string, any> = {};
        rawHeaders.forEach((h, i) => {
            if (values[i]) rawData[h] = values[i];
        });

        const clean = (s: string) => s ? s.replace(/\0/g, '').replace(/\\/g, '').trim() : "";
        const getVal = (idx: number) => (idx > -1 && values[idx]) ? clean(values[idx]) : "";

        let goalieName = "Unknown";
        if (map.firstName > -1 && map.lastName > -1) {
            goalieName = `${getVal(map.firstName)} ${getVal(map.lastName)}`.trim();
        } else if (map.fullName > -1) {
            goalieName = getVal(map.fullName);
        } else {
            goalieName = `${clean(values[1] || '')} ${clean(values[2] || '')}`.trim();
        }

        let coachName = getVal(map.coach);
        if (!coachName || coachName.length < 2) coachName = "Elliott Shevitz";

        let parentNameStr = "Unknown Parent";
        if (map.parentFirst > -1 && map.parentLast > -1) {
            parentNameStr = `${getVal(map.parentFirst)} ${getVal(map.parentLast)}`.trim();
        } else if (map.parentName > -1) {
            parentNameStr = getVal(map.parentName);
        }

        let team = getVal(map.team) || getVal(map.school) || "Unassigned";

        let email = "";
        if (targetGoalie) {
            email = targetGoalie.email;
            goalieName = targetGoalie.goalie_name;
        } else {
            email = getVal(map.email);
            if (!email || !email.includes('@')) {
                email = values.find(v => v.includes('@') && v.includes('.') && !v.includes(' ')) || "";
            }
        }
        email = clean(email);

        // Auto-Link Logic (minimal here, relied on caller or handled in object creation)
        let existingRecord = dbData.find(r => r.email?.toLowerCase() === email.toLowerCase());
        if (!existingRecord && !email && goalieName && goalieName !== "Unknown") {
            existingRecord = dbData.find(r => r.goalie_name?.toLowerCase().trim() === goalieName.toLowerCase().trim());
            if (existingRecord) email = existingRecord.email;
        }

        if (!email || email.includes(' ') || email.length > 100) {
            console.warn(`Skipping row ${idx}: Invalid Email (${email})`);
            return null;
        }

        let gradYear = getVal(map.gradYear);
        if (!gradYear && targetGoalie) gradYear = targetGoalie.grad_year.toString();
        if (!gradYear) gradYear = values.find(v => v.match(/^20[2-3][0-9]$/)) || DEFAULT_GRAD_YEAR.toString();

        // Counts
        const sCount = parseInt(getVal(map.sessionCount)) || 0;
        const lCount = parseInt(getVal(map.lessonCount)) || 0;

        // Dates
        const dateStr = getVal(map.date);
        let isoDate = null;
        let finalLocation = getVal(map.location);

        if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) isoDate = d.toISOString();
        }

        // Default fallback
        if (!isoDate) {
            const d = new Date("2024-01-01T12:00:00Z");
            isoDate = d.toISOString();
            if (!finalLocation) finalLocation = "";
        } else {
            if (!finalLocation) finalLocation = "Unknown Location";
        }

        let uniqueId = targetGoalie ? targetGoalie.assigned_unique_id : existingRecord?.assigned_unique_id;

        return {
            email: email,
            goalie_name: goalieName,
            parent_name: parentNameStr,
            parent_phone: getVal(map.phone),
            grad_year: parseInt(gradYear) || DEFAULT_GRAD_YEAR,
            team: team,
            assigned_unique_id: uniqueId, // Likely null for new
            session_count: sCount,
            lesson_count: lCount,
            raw_data: { ...rawData, _coachName: coachName },
            _session_log: {
                date: isoDate,
                start_time: getVal(map.startTime) ? new Date(getVal(map.startTime)).toISOString() : null,
                end_time: getVal(map.endTime) ? new Date(getVal(map.endTime)).toISOString() : null,
                location: finalLocation,
                notes: getVal(map.notes),
                session_number: sCount,
                lesson_number: lCount
            }
        };
    }).filter((item): item is ParsedRosterItem => item !== null);

    return parsedItems;
};
