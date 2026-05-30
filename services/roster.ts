import { supabase } from "@/utils/supabase/client";
import { ParsedRosterItem } from "@/utils/csv-parser";

export const rosterService = {
    async fetchAll() {
        const { data, error } = await supabase.from('roster_uploads').select('*');
        if (error) throw error;
        return data;
    },

    async fetchByCoachId(coachId: string) {
        // Future: specific query if needed, currently component filters client-side
        // but we can prepare this for server-side filtering later
        const { data, error } = await supabase
            .from('roster_uploads')
            .select('*')
            .eq('assigned_coach_id', coachId);

        if (error) throw error;
        return data;
    },

    async fetchByEmailOrId(email?: string | null, localId?: string | null) {
        let query = supabase.from('roster_uploads').select('*');

        if (email && localId) {
            query = query.or(`email.ilike.${email},assigned_unique_id.eq.${localId}`);
        } else if (email) {
            query = query.ilike('email', email);
        } else if (localId) {
            query = query.eq('assigned_unique_id', localId);
        } else {
            return [];
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('roster_uploads').delete().eq('id', id);
        if (error) throw error;
    },

    async upsert(payload: any) {
        const { error } = await supabase.from('roster_uploads').upsert(payload, { onConflict: 'email' });
        if (error) throw error;
    },

    async update(id: string, payload: any) {
        const { error } = await supabase.from('roster_uploads').update(payload).eq('id', id);
        if (error) throw error;
    },

    async insert(payload: any) {
        const { error } = await supabase.from('roster_uploads').insert(payload);
        if (error) throw error;
    },

    async processUpload(validRows: ParsedRosterItem[], existingData: any[]) {
        // 1. Calculate IDs for new items
        // We calculate maxId 
        const currentMaxId = existingData.reduce((max: number, item: any) => {
            const parts = item.assigned_unique_id?.split('-') || [];
            const num = parseInt(parts[1] || '0');
            if (isNaN(num)) return max;
            return num > max ? num : max;
        }, 7999);

        // Pre-fetch active profiles for 'is_claimed'
        const { data: existingProfiles } = await supabase.from('profiles').select('id, email');
        const activeEmailMap = new Set<string>();
        existingProfiles?.forEach(p => {
            if (p.email) activeEmailMap.add(p.email.toLowerCase());
        });

        // Prepare Upsert Payload
        const uniquePayload: any[] = [];
        const processedEmails = new Set<string>();

        validRows.forEach((row, idx) => {
            if (processedEmails.has(row.email)) return;
            processedEmails.add(row.email);

            let uniqueId = row.assigned_unique_id;
            if (!uniqueId) {
                uniqueId = `GC-${currentMaxId + 1 + idx}`; // Simple increment, risky if concurrent but ok for admin
            }

            const isClaimed = activeEmailMap.has(row.email.toLowerCase());

            const { _session_log, ...cleanItem } = row;
            uniquePayload.push({
                ...cleanItem,
                assigned_unique_id: uniqueId,
                is_claimed: isClaimed || cleanItem.is_claimed
            });
        });

        // 2. Roster Update (Upsert)
        if (uniquePayload.length === 0) return { success: false, message: "No unique valid rows." };

        const { error: upsertError } = await supabase
            .from('roster_uploads')
            .upsert(uniquePayload, { onConflict: 'email' });

        if (upsertError) throw upsertError;

        // 3. Process Session Logs
        // Re-fetch to get IDs
        const { data: refreshedRoster } = await supabase.from('roster_uploads').select('id, email');
        const emailToId: Record<string, string> = {};
        refreshedRoster?.forEach(r => emailToId[r.email.toLowerCase()] = r.id);

        const sessionRows: any[] = [];
        const affectedRosterIds = new Set<string>();

        validRows.forEach(row => {
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

        if (sessionRows.length > 0) {
            const affectedIdsArray = Array.from(affectedRosterIds);

            // Delete old sessions for these users (OPTIONAL: Assuming replace logic per previous code)
            const deleteBatchSize = 100;
            for (let i = 0; i < affectedIdsArray.length; i += deleteBatchSize) {
                const batch = affectedIdsArray.slice(i, i + deleteBatchSize);
                await supabase.from('sessions').delete().in('roster_id', batch);
            }

            // Insert new
            const insertBatchSize = 100;
            for (let i = 0; i < sessionRows.length; i += insertBatchSize) {
                const batch = sessionRows.slice(i, i + insertBatchSize);
                await supabase.from('sessions').insert(batch);
            }
        }

        return { success: true };
    },
    async deleteAll() {
        const { error } = await supabase.from('roster_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
    }
};
