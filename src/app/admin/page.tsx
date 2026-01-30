"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
    Loader2, UploadCloud, CheckCircle, Database, Search,
    X, Trash2, Pencil, Users, Shield, DollarSign,
    RefreshCw, FileSpreadsheet, Plus, BarChart3
} from 'lucide-react';
import TrainingInsights from '@/components/TrainingInsights';

type RosterItem = {
    id: string;
    email: string;
    goalie_name: string;
    parent_name: string;
    parent_phone: string;
    grad_year: number;
    team: string;
    assigned_unique_id: string;
    assigned_coach_id: string | null;
    is_claimed: boolean;
    payment_status: string;
    amount_paid: number;
    session_count: string; // often stored as text/int
    lesson_count: string;
    raw_data: Record<string, any>;
    created_at: string;
};

export default function AdminDashboard() {
    // UI State
    const [activeTab, setActiveTab] = useState<'roster' | 'insights' | 'sessions'>('roster');
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [searchTerm, setSearchTerm] = useState("");

    // Data State
    const [dbData, setDbData] = useState<RosterItem[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal State
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [manualForm, setManualForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        goalieEmail: "",
        team: "",
        gradYear: "2030",
        parentName: "",
        phone: "",
        coachId: "",
        rawData: {} as any
    });
    const [targetGoalieId, setTargetGoalieId] = useState<string>("");

    useEffect(() => {
        fetchRoster();
        fetchCoaches();
        fetchSessions();
    }, []);

    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchCoaches = async () => {
        // 1. Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setCurrentUser({ ...user, role: profile?.role || 'user' });

            if (profile?.role !== 'admin') {
                alert("WARNING: You are logged in as '" + (profile?.role || 'user') + "', but you need 'admin' rights to upload CSVs.\\nPlease update your role in the 'profiles' table.");
            }
        }

        const { data } = await supabase.from('profiles').select('id, goalie_name').eq('role', 'coach');
        if (data) {
            setCoaches(data.map(c => ({ id: c.id, name: c.goalie_name || 'Unnamed Coach' })));
        }
    };

    const fetchRoster = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDbData(data || []);
        } catch (e: any) {
            console.error("Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                roster:roster_uploads (goalie_name, assigned_unique_id, team)
            `)
            .order('date', { ascending: false });

        if (data) setSessions(data);
    };

    // CSV Parsing Logic
    const parseAndUpload = async (csvText: string) => {
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
                    console.log("CSV Header Mapping:", map); // DEBUG

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
                if (!gradYear && targetGoalie) gradYear = targetGoalie.grad_year.toString();
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
                // We calculate maxId outside to ensure safety
                const currentMaxId = dbData.reduce((max, item) => {
                    const parts = item.assigned_unique_id?.split('-') || [];
                    const num = parseInt(parts[1] || '0');
                    if (isNaN(num)) return max;
                    return num > max ? num : max;
                }, 7999);

                let uniqueId = targetGoalie ? targetGoalie.assigned_unique_id : existingRecord?.assigned_unique_id;

                // If we need a new ID, we must be careful not to collide with others in this SAME batch
                // We'll use a virtual index for new items only, but since we are in a map, 
                // we can just use the loop index + max + offset. 
                // Better: use a counter if we could, but map is functional.
                // Safe bet: max + 1 + idx. (Even if idx 0 was an existing user, it's fine, we just skip "holes" potentially, 
                // but for new users, we will definitely be > max).
                if (!uniqueId) {
                    // To avoid collisions within the batch itself if we have multiple new users,
                    // we simply add the current index to the max.
                    // Note: This leaves gaps if some indices were existing users, but guarantees uniqueness.
                    uniqueId = `GC-${currentMaxId + 1 + idx}`;
                }

                // Claimed Status Logic
                // If they have a profile, they are claimed.
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

                // Only strictly enforce true. If false, let DB decide (unless we strongly want reset, but usually preserving current state is safer if logic is complex).
                // Actually, if activeEmails has it, we MUST set it to true.
                if (isClaimed) payload.is_claimed = true;

                return payload;
            }).filter(item => item !== null);

            // 1. Roster Update (Upsert)
            const uniquePayload = Array.from(new Map(allParsedRows.map(item => {
                const { _session_log, ...cleanItem } = item; // Explicitly remove _session_log
                return [cleanItem.email, cleanItem];
            })).values());

            console.log(`Parsed ${allParsedRows.length} rows. Unique payloads: ${uniquePayload.length}`);

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
                const emailKey = row.email.toLowerCase();
                if (row._session_log?.date && emailToId[emailKey]) {
                    const rId = emailToId[emailKey];
                    affectedRosterIds.add(rId);
                    sessionRows.push({
                        roster_id: rId,
                        date: row._session_log.date,
                        start_time: row._session_log.start_time || row._session_log.date,
                        end_time: row._session_log.end_time || row._session_log.date, // Prevent null constraint if strict
                        location: row._session_log.location || "Unknown",
                        notes: row._session_log.notes,
                        session_number: row._session_log.session_number,
                        lesson_number: row._session_log.lesson_number,
                        is_active: false
                    });
                }
            });

            console.log(`Matched ${sessionRows.length} session logs for import.`);

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
            await fetchRoster();
            setTimeout(() => setUploadStatus("idle"), 3000);

        } catch (e: any) {
            console.error("Upload Error:", e);
            setUploadStatus("error");
            alert("Upload Error: " + (e.message || "Unknown error occurred"));
        }
    };

    // Helper Actions
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(e.type === 'dragenter' || e.type === 'dragover'); };
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) parseAndUpload(await file.text());
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            parseAndUpload(await file.text());
            // Reset input value to allow selecting the same file again
            e.target.value = '';
        }
    };

    const handleEditClick = (entry: any) => {
        setEditingId(entry.id);
        const [first, ...last] = (entry.goalie_name || "").split(" ");
        setManualForm({
            firstName: first || "",
            lastName: last.join(" ") || "",
            email: entry.email,
            goalieEmail: entry.raw_data?.goalie_email || "",
            team: entry.team,
            gradYear: entry.grad_year?.toString() || "2030",
            parentName: entry.parent_name || "",
            phone: entry.parent_phone || "",
            coachId: entry.assigned_coach_id || "",
            rawData: entry.raw_data || {}
        });
        setShowManualAdd(true);
    };

    const closeModal = () => {
        setShowManualAdd(false);
        setEditingId(null);
        setEditingId(null);
        setManualForm({ firstName: "", lastName: "", email: "", goalieEmail: "", team: "", gradYear: "2030", parentName: "", phone: "", coachId: "", rawData: {} });
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                email: manualForm.email,
                goalie_name: `${manualForm.firstName} ${manualForm.lastName}`,
                parent_name: manualForm.parentName,
                parent_phone: manualForm.phone,
                grad_year: parseInt(manualForm.gradYear) || 2030,
                team: manualForm.team || "Unassigned",
                assigned_coach_id: manualForm.coachId === "" ? null : manualForm.coachId,
                raw_data: { ...manualForm.rawData, goalie_email: manualForm.goalieEmail }
            };

            if (editingId) {
                await supabase.from('roster_uploads').update(payload).eq('id', editingId);
            } else {
                // Calculate next ID strictly based on MAX existing ID to ensure GC-8XXX standard
                const currentMaxId = dbData.reduce((max, item) => {
                    const parts = item.assigned_unique_id?.split('-') || [];
                    if (parts[0] !== 'GC') return max;
                    const num = parseInt(parts[1] || '0');
                    if (isNaN(num)) return max;
                    // Only consider IDs in the 8000+ range to stick to standard
                    return (num >= 8000 && num > max) ? num : max;
                }, 7999);

                const nextId = currentMaxId + 1;
                const uniqueId = `GC-${nextId}`;

                await supabase.from('roster_uploads').insert([{ ...payload, assigned_unique_id: uniqueId, is_claimed: true, payment_status: 'paid' }]); // Defaulting to claimed/paid for admin-created users
            }
            closeModal();
            fetchRoster();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this goalie? This action cannot be undone.")) return;

        try {
            // Delete sessions first (if not cascading)
            const { error: sessionError } = await supabase.from('sessions').delete().eq('roster_id', id);

            const { error } = await supabase.from('roster_uploads').delete().eq('id', id);

            if (error) throw error;

            alert("Goalie deleted successfully.");
            fetchRoster();
        } catch (err: any) {
            console.error("Delete failure:", err);
            alert("Delete failed: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center glass p-6 rounded-2xl">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        Admin Console
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-muted-foreground font-medium">Master Command Center</p>
                        {currentUser && (
                            <>
                                <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${currentUser.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                                    {currentUser.role}
                                </span>
                                <span className="text-xs text-muted-foreground">({currentUser.email})</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'roster' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Database size={16} /> Roster
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <FileSpreadsheet size={16} /> Event Log
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <BarChart3 size={16} /> Training Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {activeTab === 'insights' ? (
                    <TrainingInsights />
                ) : activeTab === 'sessions' ? (
                    <div className="glass rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FileSpreadsheet className="text-primary" />
                                Coaching Events Master Log
                            </h2>
                            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{sessions.length} Records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Goalie / ID</th>
                                        <th className="p-4">Session Details</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4 font-mono text-zinc-400">
                                                {new Date(session.date).toLocaleDateString()}
                                                <div className="text-xs text-zinc-600">{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold">{session.roster?.goalie_name || "Unknown"}</div>
                                                <div className="text-xs text-primary font-mono">{session.roster?.assigned_unique_id}</div>
                                                <div className="text-xs text-zinc-500">{session.roster?.team}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                                    <span className="text-xs font-bold text-gray-400">S{session.session_number}</span>
                                                    <span className="text-zinc-600">|</span>
                                                    <span className="text-xs font-bold text-white">Lesson {session.lesson_number}</span>
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-400">{session.location}</td>
                                            <td className="p-4 text-gray-500 max-w-md truncate">{session.notes}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Are you sure you want to delete this session?")) return;
                                                        const { error } = await supabase.from('sessions').delete().eq('id', session.id);
                                                        if (error) alert("Error deleting session: " + error.message);
                                                        else {
                                                            // Optimistic update
                                                            setSessions(prev => prev.filter(s => s.id !== session.id));
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete Session"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {sessions.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No sessions found. Upload a CSV or log sessions manually.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Import Section */}
                            <section className="glass rounded-2xl p-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative">
                                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <UploadCloud className="text-primary" />
                                        Smart Import
                                    </h2>

                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Target Goalie (Optional - For missing Email columns)</label>
                                        <select
                                            className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary outline-none"
                                            value={targetGoalieId}
                                            onChange={(e) => setTargetGoalieId(e.target.value)}
                                        >
                                            <option value="">-- Auto-Detect from Email Column --</option>
                                            {dbData.map(g => (
                                                <option key={g.id} value={g.id}>{g.goalie_name} ({g.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div
                                        className={`
                                            border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer mt-6
                                            ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-foreground/50 hover:bg-muted/50'}
                                        `}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept=".csv"
                                        />
                                        <div className="flex flex-col items-center gap-4">
                                            {uploadStatus === 'processing' ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                                            <p className="font-bold text-lg">
                                                {uploadStatus === 'processing' ? 'Processing...' : uploadStatus === 'success' ? 'Success!' : 'Drag & Drop CSV or Click to Upload'}
                                            </p>
                                            <p className="text-gray-500 text-sm">Supports partial updates (Email required)</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Database Table */}
                            <div className="glass rounded-2xl p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Database className="text-primary" />
                                        Roster Database
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!confirm('EXTREME DANGER: This will delete ALL roster and session data. Are you sure?')) return;
                                                setUploadStatus("processing");
                                                try {
                                                    // Client-side delete
                                                    // 1. Delete Sessions FIRST (Child records)
                                                    await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

                                                    // 2. Delete Roster (Parent records)
                                                    const { error } = await supabase.from('roster_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                                    if (error) throw error;

                                                    alert("Database Wiped Clean.");
                                                    await fetchRoster();
                                                } catch (e: any) {
                                                    alert("Delete failed: " + e.message + "\n\nPLEASE RUN THE SQL FIX IN SUPABASE DASHBOARD.");
                                                } finally {
                                                    setUploadStatus("idle");
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                                        >
                                            Reset Database
                                        </button>
                                        <button
                                            onClick={() => setShowManualAdd(true)}
                                            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:scale-105 transition-transform"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        placeholder="Search..."
                                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400">
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Goalie</th>
                                                <th className="p-4">Parent Info</th>
                                                <th className="p-4">Team</th>
                                                <th className="p-4">Data</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dbData.filter(i => i.goalie_name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.email?.includes(searchTerm)).map((entry, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="p-4 font-mono text-zinc-500">{entry.assigned_unique_id}</td>
                                                    <td className="p-4">
                                                        <div className="font-bold">{entry.goalie_name}</div>
                                                        {entry.raw_data?.goalie_email && (
                                                            <div className="text-xs text-primary mt-0.5">
                                                                Goalie: {entry.raw_data.goalie_email}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-medium text-foreground">{entry.email}</div>
                                                        <div className="text-xs text-muted-foreground">{entry.parent_name}</div>
                                                        {entry.parent_phone && <div className="text-xs text-muted-foreground">{entry.parent_phone}</div>}
                                                    </td>
                                                    <td className="p-4 text-gray-400">{entry.team} ({entry.grad_year})</td>
                                                    <td className="p-4">
                                                        {Object.keys(entry.raw_data || {}).length > 0 ? (
                                                            <div className="group relative cursor-help">
                                                                <CheckCircle size={14} className="text-emerald-500" />
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black/90 border border-white/10 rounded text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-pre-wrap">
                                                                    {JSON.stringify(entry.raw_data, null, 2)}
                                                                </div>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${entry.is_claimed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                            {entry.is_claimed ? 'Active' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                                        <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors">
                                                            <Trash2 size={16} className="text-gray-400 group-hover:text-red-500" />
                                                        </button>
                                                        <button onClick={() => handleEditClick(entry)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                                            <Pencil size={16} className="text-gray-400 hover:text-white" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-6">
                            <div className="glass p-6 rounded-2xl">
                                <div className="text-4xl font-black text-foreground">{dbData.length}</div>
                                <div className="text-sm text-muted-foreground">Total Roster</div>
                            </div>
                            <div className="glass p-6 rounded-2xl">
                                <div className="text-4xl font-black text-primary">{dbData.filter(d => d.is_claimed).length}</div>
                                <div className="text-sm text-muted-foreground">Active Users</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Manual Edit Modal */}
            {showManualAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-primary" /> {editingId ? 'Edit' : 'Add'} Goalie</h3>
                            <button onClick={closeModal}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="First Name" value={manualForm.firstName} onChange={e => setManualForm({ ...manualForm, firstName: e.target.value })} className="bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" required />
                                <input placeholder="Last Name" value={manualForm.lastName} onChange={e => setManualForm({ ...manualForm, lastName: e.target.value })} className="bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" required />
                            </div>
                            <input placeholder="Parent Email" type="email" value={manualForm.email} onChange={e => setManualForm({ ...manualForm, email: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none mb-4" required />
                            <input placeholder="Goalie Email (Optional - for Minors)" type="email" value={manualForm.goalieEmail} onChange={e => setManualForm({ ...manualForm, goalieEmail: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Team" value={manualForm.team} onChange={e => setManualForm({ ...manualForm, team: e.target.value })} className="bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" />
                                <input placeholder="Grad Year" value={manualForm.gradYear} onChange={e => setManualForm({ ...manualForm, gradYear: e.target.value })} className="bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" />
                            </div>
                            <select className="w-full bg-black/50 border border-white/10 rounded p-3 focus:border-indigo-500 outline-none" value={manualForm.coachId} onChange={e => setManualForm({ ...manualForm, coachId: e.target.value })}>
                                <option value="">-- No Coach --</option>
                                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded font-bold">Save</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
