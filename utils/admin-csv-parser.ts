import { supabase } from '@/utils/supabase/client';
import { RosterItem } from '@/types';

type UploadStatus = "idle" | "processing" | "success" | "error";

export const parseAndUploadCSV = async (
    csvText: string,
    dbData: RosterItem[],
    targetGoalieId: string,
    setUploadStatus: (status: UploadStatus) => void,
    refreshCallback: () => Promise<void>
) => {
    setUploadStatus("processing");
    try {
        // Pre-process: Remove BOM if present
        csvText = csvText.replace(/^\uFEFF/, '');

        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
            alert("CSV is empty or invalid.");
            setUploadStatus("error");
            return;
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
        // Look for the first row that contains "Email" or "Goalie Name"
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
            parentName: -1, // Full Name fallback
            phone: -1,
            // Training Counts
            sessionCount: -1,
            lessonCount: -1,
            // Session History Details
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

            // Enhanced Detection: If target is set, we can look for Date/Session headers too
            const isStandardHeader = row.some(c => c.includes('email') || c.includes('goalie'));
            const isDataHeader = targetGoalieId && row.some(c => c.includes('date') || c.includes('session') || c.includes('s#') || c.includes('notes'));

            if (isStandardHeader || isDataHeader) {
                headerRowIndex = i;
                rawHeaders = splitLine(lines[i]); // Keep original case for raw_data
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

                    date: potentialHeaders.findIndex(h => h.includes('date') || h.includes('start datetime')), // Catch 'Start Datetime' as valid date source
                    startTime: potentialHeaders.findIndex(h => (h.includes('start') && (h.includes('time') || h.includes('datetime')))),
                    endTime: potentialHeaders.findIndex(h => (h.includes('end') && (h.includes('time') || h.includes('datetime')))),
                    location: potentialHeaders.findIndex(h => h.includes('location') || h.includes('rink') || h.includes('venue')),
                    notes: potentialHeaders.findIndex(h => h.includes('notes') || h.includes('comments') || h.includes('raw summary')), // Catch 'raw summary'
                    coach: potentialHeaders.findIndex(h => h.includes('coach') || h.includes('instructor'))
                };
                // console.log("CSV Header Mapping:", map); // DEBUG

                if (map.email === -1 && !targetGoalie) {
                    alert(`Error: Could not find an 'Email' column in the CSV.\n\nHeaders Found: ${potentialHeaders.join(', ')}\n\nEither add an 'Email' column OR select a 'Target Goalie' from the dropdown above to force-assign these records.`);
                    setUploadStatus("error");
                    return;
                }
                break;
            }
        }

        // FORCE DEFAULTS
        if (map.firstName === -1 && map.fullName === -1) map.firstName = 1;
        if (map.lastName === -1 && map.fullName === -1) map.lastName = 2;

        // 0. Pre-fetch Data for Intelligence
        const { data: existingProfiles } = await supabase.from('profiles').select('id, email');
        const activeEmailMap = new Map<string, string>(); // email -> uuid
        existingProfiles?.forEach(p => {
            if (p.email) activeEmailMap.set(p.email.toLowerCase(), p.id);
        });

        const activeEmails = new Set(activeEmailMap.keys());

        const allParsedRows = lines.slice(headerRowIndex + 1).map((line, idx) => {
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

            // Coach Assignment (Default to Elliott if not specified)
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

            // Auto-Link Logic
            let existingRecord = dbData.find(r => r.email?.toLowerCase() === email.toLowerCase());
            if (!existingRecord && !email && goalieName && goalieName !== "Unknown") {
                existingRecord = dbData.find(r => r.goalie_name?.toLowerCase().trim() === goalieName.toLowerCase().trim());
                if (existingRecord) email = existingRecord.email;
            }

            if (!email || email.includes(' ') || email.length > 100) {
                console.warn(`Skipping row ${idx}: Invalid Email (${email})`, values);
                return null;
            }

            let gradYear = getVal(map.gradYear);
            if (!gradYear && targetGoalie) gradYear = (targetGoalie.grad_year || 2030).toString();
            if (!gradYear) gradYear = values.find(v => v.match(/^20[2-3][0-9]$/)) || "2030";

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

            // Default fallback if no date found
            if (!isoDate) {
                const d = new Date("2024-01-01T12:00:00Z");
                isoDate = d.toISOString();
                if (!finalLocation) finalLocation = "";
            } else {
                if (!finalLocation) finalLocation = "Unknown Location";
            }

            // ID Logic: Preserve existing or Generate new based on MAX ID
            const currentMaxId = dbData.reduce((max, item) => {
                const parts = item.assigned_unique_id?.split('-') || [];
                const num = parseInt(parts[1] || '0');
                if (isNaN(num)) return max;
                return num > max ? num : max;
            }, 7999);

            let uniqueId = targetGoalie ? targetGoalie.assigned_unique_id : existingRecord?.assigned_unique_id;

            if (!uniqueId) {
                uniqueId = `GC-${currentMaxId + 1 + idx}`;
            }

            // Claimed Status Logic
            const isClaimed = activeEmails.has(email.toLowerCase());

            const payload: any = {
                email: email,
                goalie_name: goalieName,
                parent_name: parentNameStr,
                parent_phone: getVal(map.phone),
                grad_year: parseInt(gradYear) || 2030,
                team: team,
                assigned_unique_id: uniqueId,
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

            if (isClaimed) payload.is_claimed = true;

            return payload;
        }).filter(item => item !== null);

        // 1. Roster Update (Upsert)
        const uniquePayload = Array.from(new Map(allParsedRows.map(item => {
            const { _session_log, ...cleanItem } = item!; // Explicitly remove _session_log
            return [cleanItem.email, cleanItem];
        })).values());

        // console.log(`Parsed ${allParsedRows.length} rows. Unique payloads: ${uniquePayload.length}`);

        if (uniquePayload.length === 0) {
            alert("Upload Failed: No valid rows found! Please check your CSV format.\nEnsure there is a valid 'Email' column and that the file is not empty.");
            setUploadStatus("error");
            return;
        }

        const { error } = await supabase.from('roster_uploads').upsert(uniquePayload, { onConflict: 'email' });

        if (error) {
            throw new Error("Roster Update Failed: " + error.message);
        }

        // 2. Session History Update
        // Get IDs
        const { data: currentRoster, error: fetchError } = await supabase.from('roster_uploads').select('id, email');
        if (fetchError) throw new Error("Failed to fetch fresh roster: " + fetchError.message);

        const emailToId: Record<string, string> = {};
        currentRoster?.forEach(r => emailToId[r.email.toLowerCase()] = r.id);

        const sessionRows: any[] = [];
        const affectedRosterIds = new Set<string>();

        allParsedRows.forEach(row => {
            if (!row) return;
            const emailKey = row.email.toLowerCase();
            if (row._session_log?.date && emailToId[emailKey]) {
                const rId = emailToId[emailKey];
                affectedRosterIds.add(rId);
                sessionRows.push({
                    roster_id: rId,
                    date: row._session_log.date,
                    start_time: row._session_log.start_time || row._session_log.date,
                    end_time: row._session_log.end_time || row._session_log.date,
                    location: row._session_log.location || "Unknown",
                    notes: row._session_log.notes,
                    session_number: row._session_log.session_number,
                    lesson_number: row._session_log.lesson_number,
                    is_active: false
                });
            }
        });

        // console.log(`Matched ${sessionRows.length} session logs for import.`);

        if (sessionRows.length > 0) {
            const affectedIdsArray = Array.from(affectedRosterIds);

            // Batch Delete
            const deleteBatchSize = 100;
            for (let i = 0; i < affectedIdsArray.length; i += deleteBatchSize) {
                const batch = affectedIdsArray.slice(i, i + deleteBatchSize);
                const { error: deleteError } = await supabase.from('sessions').delete().in('roster_id', batch);
                if (deleteError) throw new Error("Failed to clear old sessions: " + deleteError.message);
            }

            // Batch Insert
            const insertBatchSize = 100;
            for (let i = 0; i < sessionRows.length; i += insertBatchSize) {
                const batch = sessionRows.slice(i, i + insertBatchSize);
                const { error: insertError } = await supabase.from('sessions').insert(batch);
                if (insertError) throw new Error("Failed to insert sessions: " + insertError.message);
            }
        }

        setUploadStatus("success");
        await refreshCallback();
        setTimeout(() => setUploadStatus("idle"), 3000);

    } catch (e: any) {
        console.error("Upload Error:", e);
        setUploadStatus("error");
        alert("Upload Error: " + (e.message || "Unknown error occurred"));
    }
};
