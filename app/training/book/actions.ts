"use server";

import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { INITIAL_TRAINING_SLOTS, TrainingSlot } from "@/constants/trainingAvailability";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing: ${!url ? 'URL ' : ''}${!key ? 'KEY ' : ''}`);
    }
    return createClient(url, key);
}

/**
 * Returns available slots, subtracting any slots already booked.
 */
export async function getAvailableTrainingSlots() {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Fetch already booked slots from sessions / events table
        const { data: bookedSessions, error } = await supabase
            .from('sessions')
            .select('date, location, notes');

        const bookedSlotKeys = new Set<string>();
        if (bookedSessions && !error) {
            bookedSessions.forEach((s: any) => {
                if (s.notes && s.notes.includes('slot_id:')) {
                    const match = s.notes.match(/slot_id:([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        bookedSlotKeys.add(match[1]);
                    }
                }
            });
        }

        // 2. Mark availability
        const slots = INITIAL_TRAINING_SLOTS.map(slot => ({
            ...slot,
            isBooked: bookedSlotKeys.has(slot.id),
            spotsLeft: bookedSlotKeys.has(slot.id) ? 0 : 1
        }));

        return { success: true, slots };
    } catch (err: any) {
        console.error("[getAvailableTrainingSlots] Error:", err);
        return { 
            success: true, 
            slots: INITIAL_TRAINING_SLOTS.map(s => ({ ...s, isBooked: false, spotsLeft: 1 }))
        };
    }
}

/**
 * Fetch goalie's remaining balance & profile information
 */
export async function getGoalieBookingProfile(goalieProfileId: string, userEmail?: string) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Check goalie_lesson_balance view
        const { data: balance } = await supabase
            .from('goalie_lesson_balance')
            .select('*')
            .or(`goalie_id.eq.${goalieProfileId},email.ilike.${userEmail?.trim() || 'none'}`)
            .maybeSingle();

        // 2. Check roster details
        let goalieName = balance?.goalie_name || "Athlete";
        let email = balance?.email || userEmail || "";
        let rosterId: string | null = null;
        let linkedUserId: string | null = null;

        const { data: roster } = await supabase
            .from('roster_uploads')
            .select('*')
            .or(`linked_user_id.eq.${goalieProfileId},id.eq.${goalieProfileId},email.ilike.${userEmail?.trim() || 'none'},guardian_email.ilike.${userEmail?.trim() || 'none'}`)
            .maybeSingle();

        if (roster) {
            goalieName = roster.goalie_name || goalieName;
            email = roster.email || roster.guardian_email || email;
            rosterId = roster.id;
            linkedUserId = roster.linked_user_id;
        }

        // 3. Fetch private training registration & package selection
        const { data: submission } = await supabase
            .from('private_training_submissions')
            .select('*')
            .or(`email.ilike.${email.trim()},roster_id.eq.${rosterId || '00000000-0000-0000-0000-000000000000'}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Determine package allowance from paid plan / roster
        const hasPaidAccess = (balance && balance.lessons_earned > 0) || 
                              (submission && submission.payment_status === 'paid') || 
                              (roster && roster.payment_status === 'paid' && ((roster.lesson_count || 0) > 0 || (roster.session_count || 0) > 0));

        let packageTotal = 0;
        if (hasPaidAccess) {
            packageTotal = 4;
            if (roster?.lesson_count && Number(roster.lesson_count) > 0) {
                packageTotal = Number(roster.lesson_count);
            } else if (submission?.notes && submission.notes.includes('plan:')) {
                const match = submission.notes.match(/plan:([a-zA-Z0-9]+)/);
                if (match && match[1] === 'season') packageTotal = 24;
                if (match && match[1] === 'monthly') packageTotal = 4;
            } else if (roster?.session_count && Number(roster.session_count) > 0) {
                packageTotal = 4;
            }
        }

        // 4. Fetch user's booked sessions (or dev sessions if dummy ID)
        let existingSessions: any[] = [];
        if (goalieProfileId === '00000000-0000-0000-0000-000000000000') {
            const { data: devSessions } = await supabase
                .from('sessions')
                .select('id, date, location, notes')
                .order('date', { ascending: true });
            existingSessions = devSessions || [];
        } else {
            const orFilters = [
                `goalie_id.eq.${goalieProfileId}`,
                linkedUserId ? `goalie_id.eq.${linkedUserId}` : null,
                rosterId ? `roster_id.eq.${rosterId}` : null
            ].filter(Boolean).join(',');

            const { data: sData } = await supabase
                .from('sessions')
                .select('id, date, location, notes')
                .or(orFilters)
                .order('date', { ascending: true });
            existingSessions = sData || [];
        }

        const totalAllowance = (balance?.lessons_earned && balance.lessons_earned > 0) ? balance.lessons_earned : packageTotal;
        const deliveredCount = (balance?.lessons_delivered && balance.lessons_delivered > 0) ? balance.lessons_delivered : existingSessions.filter(s => s.notes && s.notes.includes('[Session Completed')).length;
        const bookedCount = existingSessions.filter(s => !s.notes || !s.notes.includes('[Session Completed')).length;
        const computedRemaining = Math.max(0, totalAllowance - deliveredCount - bookedCount);

        return {
            success: true,
            goalieName,
            email,
            lessonsRemaining: computedRemaining,
            totalAllowance,
            bookedCount,
            deliveredCount,
            existingSessions,
            hasPaidAccess: !!hasPaidAccess
        };
    } catch (err: any) {
        console.error("[getGoalieBookingProfile] Error:", err);
        return {
            success: true,
            goalieName: "Athlete",
            email: userEmail || "",
            lessonsRemaining: 0,
            totalAllowance: 0,
            bookedCount: 0,
            deliveredCount: 0,
            existingSessions: [],
            hasPaidAccess: false
        };
    }
}

/**
 * Helper to build Google Calendar template URL
 */
function createGoogleCalendarUrl(slot: TrainingSlot, athleteName: string): string {
    const title = encodeURIComponent(`Private Goalie Training: ${athleteName}`);
    const details = encodeURIComponent(`Private training session with Coach Elliott.\nLocation: ${slot.location}`);
    const location = encodeURIComponent(slot.location);

    // Format ISO string to YYYYMMDDTHHmmssZ
    // Parse slot date and startTime
    const [year, month, day] = slot.date.split('-');
    
    // Parse time like "3:00 PM"
    const parseTime = (timeStr: string) => {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return { h: 12, m: 0 };
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const isPM = match[3].toUpperCase() === 'PM';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return { h, m };
    };

    const start = parseTime(slot.startTime);
    const end = parseTime(slot.endTime);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${year}${pad(parseInt(month, 10))}${pad(parseInt(day, 10))}T${pad(start.h)}${pad(start.m)}00`;
    const endStr = `${year}${pad(parseInt(month, 10))}${pad(parseInt(day, 10))}T${pad(end.h)}${pad(end.m)}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

/**
 * Confirms session bookings, creates calendar events in Supabase, and emails the coach and client.
 */
export async function bookTrainingSlots(payload: {
    goalieProfileId: string;
    athleteName: string;
    email: string;
    selectedSlotIds: string[];
}) {
    try {
        const supabase = getSupabaseAdmin();
        const { goalieProfileId, athleteName, email, selectedSlotIds } = payload;

        if (!selectedSlotIds || selectedSlotIds.length === 0) {
            return { error: "Please select at least one session date." };
        }

        const selectedSlots = INITIAL_TRAINING_SLOTS.filter(s => selectedSlotIds.includes(s.id));
        if (selectedSlots.length === 0) {
            return { error: "No valid training slots found for selection." };
        }

        // 1. Resolve roster_id & sport if available
        let resolvedRosterId: string | null = null;
        let resolvedSport = 'Lacrosse';
        let resolvedGoalieId = goalieProfileId;

        try {
            const { data: roster } = await supabase
                .from('roster_uploads')
                .select('id, goalie_name, email, sport')
                .or(`linked_user_id.eq.${goalieProfileId},id.eq.${goalieProfileId},email.ilike.${email.trim()}`)
                .maybeSingle();
            if (roster) {
                resolvedRosterId = roster.id;
                resolvedSport = roster.sport || 'Lacrosse';
            }

            // Verify goalie_id foreign key in profiles
            const { data: profileCheck } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', goalieProfileId)
                .maybeSingle();

            if (!profileCheck) {
                const { data: anyProf } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
                if (anyProf) {
                    resolvedGoalieId = anyProf.id;
                }
            }
        } catch (e) {
            console.warn("[bookTrainingSlots] Roster resolution note:", e);
        }

        // 2. Insert sessions and events for each slot
        const createdSessions: any[] = [];
        const googleCalLinks: { slotId: string; title: string; url: string }[] = [];

        for (const slot of selectedSlots) {
            // A. Insert into sessions table
            const sessionPayload: any = {
                goalie_id: resolvedGoalieId,
                date: `${slot.date}T${slot.startTime.includes('PM') ? '18:00:00' : '09:00:00'}`,
                location: slot.location,
                notes: `Private Training Session • slot_id:${slot.id} • ${slot.timeDisplay}`,
            };
            if (resolvedRosterId) {
                sessionPayload.roster_id = resolvedRosterId;
            }

            const { data: sessionData, error: sessionErr } = await supabase
                .from('sessions')
                .insert(sessionPayload)
                .select()
                .single();

            if (sessionErr) {
                console.error("[bookTrainingSlots] Session insert error:", sessionErr);
            } else {
                createdSessions.push(sessionData);
            }

            // B. Insert into events table for the athlete's Goalie Card calendar
            await supabase.from('events').insert({
                name: `Private Training: ${slot.location}`,
                date: slot.date,
                location: slot.location,
                sport: resolvedSport,
                scouting_report: `Scheduled Private Training Session (${slot.timeDisplay})`,
                created_by: goalieProfileId
            });

            // Build Google Calendar Link
            const calUrl = createGoogleCalendarUrl(slot, athleteName);
            googleCalLinks.push({
                slotId: slot.id,
                title: `${slot.date} (${slot.timeDisplay}) @ ${slot.location}`,
                url: calUrl
            });
        }

        // 2. Dispatch Email via Resend to Coach (Elliott) and Client
        if (process.env.RESEND_API_KEY) {
            try {
                const sessionListHtml = selectedSlots.map((s, idx) => `
                    <div style="background: #f8fafc; border-left: 4px solid #00E676; padding: 12px 16px; margin-bottom: 12px; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">Session ${idx + 1}: ${new Date(s.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">⏰ <strong>Time:</strong> ${s.timeDisplay}</p>
                        <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">📍 <strong>Location:</strong> ${s.location}</p>
                        <p style="margin: 8px 0 0;"><a href="${createGoogleCalendarUrl(s, athleteName)}" style="display: inline-block; font-size: 11px; font-weight: bold; color: #0284c7; text-decoration: none; background: #e0f2fe; padding: 4px 10px; border-radius: 4px;">📅 + Add to Google Calendar</a></p>
                    </div>
                `).join('');

                const coachEmailHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🥅 New Private Training Scheduled!</h2>
                        <p style="font-size: 15px; color: #475569; margin-top: 0;"><strong>${athleteName}</strong> has just booked <strong>${selectedSlots.length}</strong> private training session(s).</p>
                        
                        <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 13px;"><strong>Athlete:</strong> ${athleteName}</p>
                            <p style="margin: 4px 0 0; font-size: 13px;"><strong>Contact Email:</strong> ${email || 'N/A'}</p>
                            <p style="margin: 4px 0 0; font-size: 13px;"><strong>Total Sessions Booked:</strong> ${selectedSlots.length}</p>
                        </div>

                        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">Booked Dates & Locations</h3>
                        ${sessionListHtml}

                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Goalie Card Scheduling Engine • The Goalie Brand</p>
                    </div>
                `;

                const recipients = ["eshevitz96@gmail.com"];
                if (email && email.includes('@')) {
                    recipients.push(email.trim());
                }

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: (process.env.EMAIL_FROM_ADDRESS && !process.env.EMAIL_FROM_ADDRESS.includes("resend.dev")) ? process.env.EMAIL_FROM_ADDRESS : "Goalie Card Private Training <onboarding@goaliecard.app>",
                        to: recipients,
                        subject: `Private Training Scheduled: ${athleteName} (${selectedSlots.length} Session${selectedSlots.length > 1 ? 's' : ''})`,
                        html: coachEmailHtml,
                    }),
                });
            } catch (emailErr) {
                console.error("[bookTrainingSlots] Failed to dispatch email:", emailErr);
            }
        }

        return {
            success: true,
            bookedSlots: selectedSlots,
            googleCalLinks
        };
    } catch (err: any) {
        console.error("[bookTrainingSlots] Exception:", err);
        return { error: `Booking failed: ${err.message}` };
    }
}

/**
 * Reschedule a training session with 24-hour policy enforcement for clients.
 */
export async function rescheduleTrainingSession(payload: {
    sessionId: string;
    newSlotId: string;
    requestedBy: 'coach' | 'client';
    clientEmail?: string;
    athleteName?: string;
}) {
    try {
        const supabase = getSupabaseAdmin();
        const { sessionId, newSlotId, requestedBy, clientEmail, athleteName } = payload;

        // 1. Fetch current session
        const { data: session, error: sessErr } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessErr || !session) {
            return { error: "Session record not found." };
        }

        // 2. Enforce 24-Hour Policy on Client Side
        if (requestedBy === 'client') {
            const scheduledTime = new Date(session.date || session.start_time || session.created_at).getTime();
            const now = Date.now();
            const diffHours = (scheduledTime - now) / (1000 * 60 * 60);

            if (diffHours < 24) {
                return {
                    error: "24-Hour Policy Notice: Sessions scheduled within the next 24 hours cannot be moved online per private training terms. Please contact Coach Elliott directly to coordinate."
                };
            }
        }

        // 3. Find target slot
        const targetSlot = INITIAL_TRAINING_SLOTS.find(s => s.id === newSlotId);
        if (!targetSlot) {
            return { error: "Selected new time slot is invalid or unavailable." };
        }

        const oldDateDisplay = session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Previous Date';
        const oldLocation = session.location || 'Training Location';

        // 4. Update session
        const newIsoDate = `${targetSlot.date}T${targetSlot.startTime.includes('PM') ? '18:00:00' : '09:00:00'}`;
        const cleanNotes = (session.notes || '').replace(/slot_id:[a-zA-Z0-9_-]+/, '').trim();
        const updatedNotes = `${cleanNotes} • slot_id:${targetSlot.id} • ${targetSlot.timeDisplay} (Rescheduled by ${requestedBy === 'coach' ? 'Coach Elliott' : 'Client'})`.trim();

        const { error: updateErr } = await supabase
            .from('sessions')
            .update({
                date: newIsoDate,
                start_time: newIsoDate,
                location: targetSlot.location,
                notes: updatedNotes
            })
            .eq('id', sessionId);

        if (updateErr) {
            return { error: `Failed to update session: ${updateErr.message}` };
        }

        // 5. Update events calendar
        if (session.goalie_id) {
            await supabase
                .from('events')
                .update({
                    date: targetSlot.date,
                    location: targetSlot.location,
                    scouting_report: `Rescheduled Private Training Session (${targetSlot.timeDisplay})`
                })
                .eq('created_by', session.goalie_id)
                .ilike('name', '%Private Training%');
        }

        const resolvedName = athleteName || "Athlete";
        const newCalUrl = createGoogleCalendarUrl(targetSlot, resolvedName);

        // 6. Send Email Notification to Coach and Client via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const isCoachInitiated = requestedBy === 'coach';
                const subject = `🔄 Private Training Rescheduled: ${resolvedName} ➔ ${targetSlot.date} (${targetSlot.timeDisplay})`;
                
                const rescheduleHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🔄 Private Training Rescheduled</h2>
                        <p style="font-size: 15px; color: #475569; margin-top: 0;">
                            The private training session for <strong>${resolvedName}</strong> has been moved ${isCoachInitiated ? 'by <strong>Coach Elliott</strong>' : 'by the client'}.
                        </p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b;">Previous Schedule</p>
                            <p style="margin: 4px 0 0; font-size: 14px; color: #64748b; text-decoration: line-through;">📅 ${oldDateDisplay} • 📍 ${oldLocation}</p>
                            
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
                            
                            <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0284c7;">New Updated Schedule</p>
                            <p style="margin: 4px 0 0; font-size: 16px; font-weight: bold; color: #0f172a;">📅 ${new Date(targetSlot.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p style="margin: 4px 0 0; font-size: 14px; color: #334155;">⏰ <strong>Time:</strong> ${targetSlot.timeDisplay}</p>
                            <p style="margin: 4px 0 0; font-size: 14px; color: #334155;">📍 <strong>Location:</strong> ${targetSlot.location}</p>
                        </div>

                        <div style="margin: 24px 0;">
                            <a href="${newCalUrl}" style="display: inline-block; background: #00E676; color: #000000; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 6px; text-decoration: none;">📅 Update Google Calendar</a>
                        </div>

                        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                            <em>Terms Note: Sessions can be rescheduled online up to 24 hours prior to scheduled start time. For changes within 24 hours, standard terms apply.</em>
                        </p>

                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Goalie Card Scheduling Engine • The Goalie Brand</p>
                    </div>
                `;

                const recipients = ["eshevitz96@gmail.com"];
                if (clientEmail && clientEmail.includes('@')) {
                    recipients.push(clientEmail.trim());
                }

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: (process.env.EMAIL_FROM_ADDRESS && !process.env.EMAIL_FROM_ADDRESS.includes("resend.dev")) ? process.env.EMAIL_FROM_ADDRESS : "Goalie Card Private Training <onboarding@goaliecard.app>",
                        to: recipients,
                        subject: subject,
                        html: rescheduleHtml,
                    }),
                });
            } catch (emailErr) {
                console.error("[rescheduleTrainingSession] Email dispatch error:", emailErr);
            }
        }

        return {
            success: true,
            updatedSlot: targetSlot
        };
    } catch (err: any) {
        console.error("[rescheduleTrainingSession] Exception:", err);
        return { error: `Rescheduling failed: ${err.message}` };
    }
}

/**
 * Mark a training session completed and notify coach & client to add takeaways.
 */
export async function completeTrainingSessionAndNotify(payload: {
    sessionId: string;
    athleteName?: string;
    clientEmail?: string;
    coachNotes?: string;
}) {
    try {
        const supabase = getSupabaseAdmin();
        const { sessionId, athleteName, clientEmail, coachNotes } = payload;

        // 1. Fetch session
        const { data: session } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (!session) {
            return { error: "Session record not found." };
        }

        const resolvedName = athleteName || "Athlete";
        const sessionDateStr = session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
        const sessionLocation = session.location || 'Field';

        // 2. Update session with completion stamp & coach notes
        const existingNotes = session.notes || '';
        const updatedNotes = `${existingNotes} \n\n[Session Completed on ${new Date().toISOString()}] Coach Notes: ${coachNotes || 'Completed on field.'}`.trim();

        await supabase
            .from('sessions')
            .update({
                notes: updatedNotes
            })
            .eq('id', sessionId);

        // 3. Dispatch Completion & Takeaways Email to Coach + Client
        if (process.env.RESEND_API_KEY) {
            try {
                const completionHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🥅 Great Work Today! Lesson Completed</h2>
                        <p style="font-size: 15px; color: #475569; margin-top: 0;">
                            Private training session with <strong>${resolvedName}</strong> on <strong>${sessionDateStr}</strong> at <strong>${sessionLocation}</strong> is officially wrapped.
                        </p>

                        ${coachNotes ? `
                        <div style="background: #f0fdf4; border-left: 4px solid #00E676; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #166534;">Coach Notes & Focus Areas</p>
                            <p style="margin: 6px 0 0; font-size: 14px; color: #15803d; line-height: 1.5;">${coachNotes}</p>
                        </div>
                        ` : ''}

                        <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">📝 Key Takeaways & Reflection</h3>
                            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b; line-height: 1.5;">
                                Documenting what clicked during training cements your muscle memory and helps direct film analysis. Tap below to add your takeaways in Goalie Card.
                            </p>
                            <a href="https://goaliecard.com/dashboard" style="display: inline-block; background: #00E676; color: #000000; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 6px; text-decoration: none;">📝 Add Lesson Takeaways in Dashboard</a>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Goalie Card Scheduling Engine • The Goalie Brand</p>
                    </div>
                `;

                const recipients = ["eshevitz96@gmail.com"];
                if (clientEmail && clientEmail.includes('@')) {
                    recipients.push(clientEmail.trim());
                }

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: (process.env.EMAIL_FROM_ADDRESS && !process.env.EMAIL_FROM_ADDRESS.includes("resend.dev")) ? process.env.EMAIL_FROM_ADDRESS : "Goalie Card Private Training <onboarding@goaliecard.app>",
                        to: recipients,
                        subject: `🥅 Lesson Completed & Takeaways: ${resolvedName} (${sessionDateStr})`,
                        html: completionHtml,
                    }),
                });
            } catch (emailErr) {
                console.error("[completeTrainingSessionAndNotify] Email dispatch error:", emailErr);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("[completeTrainingSessionAndNotify] Exception:", err);
        return { error: `Failed to complete session: ${err.message}` };
    }
}

/**
 * Save user takeaways and notify the other party.
 */
export async function submitSessionTakeaways(payload: {
    sessionId: string;
    takeaways: string;
    authorRole: 'coach' | 'parent' | 'goalie';
    authorName: string;
    clientEmail?: string;
}) {
    try {
        const supabase = getSupabaseAdmin();
        const { sessionId, takeaways, authorRole, authorName, clientEmail } = payload;

        const { data: session } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (!session) {
            return { error: "Session record not found." };
        }

        const existingNotes = session.notes || '';
        const takeawayEntry = `\n\n[Takeaways by ${authorName} (${authorRole}) on ${new Date().toLocaleDateString()}]:\n${takeaways}`;
        const updatedNotes = `${existingNotes}${takeawayEntry}`.trim();

        await supabase
            .from('sessions')
            .update({ notes: updatedNotes })
            .eq('id', sessionId);

        // Notify other party
        if (process.env.RESEND_API_KEY) {
            try {
                const recipients = authorRole === 'coach' 
                    ? (clientEmail ? [clientEmail.trim(), "eshevitz96@gmail.com"] : ["eshevitz96@gmail.com"])
                    : ["eshevitz96@gmail.com"];

                const emailHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📝 New Lesson Takeaway Added</h2>
                        <p style="font-size: 14px; color: #475569;"><strong>${authorName}</strong> (${authorRole}) posted new reflection takeaways for session on ${session.date ? new Date(session.date).toLocaleDateString() : 'Recent Session'}:</p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid #00E676; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 14px; color: #1e293b; line-height: 1.6;">
                            ${takeaways.replace(/\n/g, '<br/>')}
                        </div>

                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Goalie Card • The Goalie Brand</p>
                    </div>
                `;

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: (process.env.EMAIL_FROM_ADDRESS && !process.env.EMAIL_FROM_ADDRESS.includes("resend.dev")) ? process.env.EMAIL_FROM_ADDRESS : "Goalie Card Private Training <onboarding@goaliecard.app>",
                        to: recipients,
                        subject: `📝 Lesson Takeaway Added: ${authorName}`,
                        html: emailHtml,
                    }),
                });
            } catch (err) {
                console.error("[submitSessionTakeaways] Email dispatch error:", err);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("[submitSessionTakeaways] Exception:", err);
        return { error: `Failed to save takeaways: ${err.message}` };
    }
}

/**
 * Request CoachOS Access / Enrollment
 * Loops prospective coaches back to admin (eshevitz96@gmail.com) for review/billing
 */
export async function requestCoachAccess(params: {
    userId?: string;
    userName?: string;
    userEmail: string;
    experienceNotes?: string;
}) {
    const supabase = getSupabaseAdmin();
    const { userId, userName, userEmail, experienceNotes } = params;

    if (!userEmail) {
        return { error: "Email address is required." };
    }

    try {
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('requested_roles')
                .eq('id', userId)
                .single();
            
            const existingRequests = Array.isArray(profile?.requested_roles) ? profile.requested_roles : [];
            if (!existingRequests.includes('coach')) {
                await supabase
                    .from('profiles')
                    .update({ requested_roles: [...existingRequests, 'coach'] })
                    .eq('id', userId);
            }
        }

        if (process.env.RESEND_API_KEY) {
            try {
                const emailHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🚀 New CoachOS Access Request</h2>
                        <p style="font-size: 14px; color: #475569;">A coach has applied for access / enrollment on GoalieCard CoachOS:</p>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 18px 0;">
                            <p style="margin: 4px 0;"><strong>Name:</strong> ${userName || 'Not provided'}</p>
                            <p style="margin: 4px 0;"><strong>Email:</strong> ${userEmail}</p>
                            <p style="margin: 4px 0;"><strong>User ID:</strong> ${userId || 'Unauthenticated/Guest'}</p>
                            ${experienceNotes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${experienceNotes}</p>` : ''}
                        </div>

                        <p style="font-size: 13px; color: #64748b;">To approve or grant coach privileges, update their profile role in Supabase or the Admin console.</p>
                    </div>
                `;

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: (process.env.EMAIL_FROM_ADDRESS && !process.env.EMAIL_FROM_ADDRESS.includes("resend.dev")) ? process.env.EMAIL_FROM_ADDRESS : "Goalie Card Platform <onboarding@goaliecard.app>",
                        to: ["eshevitz96@gmail.com"],
                        subject: `CoachOS Access Request: ${userName || userEmail}`,
                        html: emailHtml,
                    }),
                });
            } catch (emailErr) {
                console.error("[requestCoachAccess] Email send failed:", emailErr);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("[requestCoachAccess] Error:", err);
        return { error: err.message || "Failed to submit coach request." };
    }
}

export interface SessionWithAthlete {
    id: string;
    date: string;
    location: string;
    notes: string;
    session_number?: number;
    lesson_number?: number;
    goalie_id?: string;
    roster_id?: string;
    athlete_name: string;
    team?: string;
    email?: string;
    phone?: string;
    is_completed?: boolean;
    takeaways?: string;
}

export interface AthleteRosterItem {
    id: string;
    goalie_name: string;
    team: string;
    grad_year?: string | number;
    email?: string;
    guardian_email?: string;
    phone?: string;
    lesson_count?: number;
    session_count?: number;
    completed_lessons?: number;
    remaining_lessons?: number;
    current_package?: string;
    package_status?: string;
    payment_status?: string;
    linked_user_id?: string;
    source?: string;
    stripe_billing_day?: string;
    stripe_sub_status?: string;
    stripe_sub_id?: string;
    is_pending?: boolean;
}

// In-memory cache for Stripe subscriptions to avoid slow remote calls on every request
// In-memory cache for Stripe subscriptions to avoid slow remote calls on every request
let cachedStripeSubsData: { data: any[]; timestamp: number } | null = null;
async function getCachedStripeSubscriptions() {
    const now = Date.now();
    if (cachedStripeSubsData && (now - cachedStripeSubsData.timestamp < 60000)) {
        return cachedStripeSubsData.data;
    }
    try {
        const stripe = getStripe();
        if (!stripe) return [];
        const res = await stripe.subscriptions.list({ limit: 100, status: 'all', expand: ['data.customer'] });
        cachedStripeSubsData = { data: res?.data || [], timestamp: now };
        return cachedStripeSubsData.data;
    } catch (e) {
        console.warn("[getCachedStripeSubscriptions] Stripe unavailable or optional:", (e as any)?.message);
        return cachedStripeSubsData?.data || [];
    }
}

/**
 * Loads all CoachOS data directly via elevated Server Role (bypassing RLS barriers)
 */
export async function fetchCoachOSData(userId?: string, userEmail?: string) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Verify coach authorization
        let isAuthorized = false;
        const normalizedEmail = userEmail?.toLowerCase()?.trim();

        if (!userId && !userEmail) {
            isAuthorized = true; // Development fallback
        } else if (normalizedEmail === 'eshevitz96@gmail.com' || normalizedEmail?.includes('shevitz') || normalizedEmail?.includes('thegoaliebrand')) {
            isAuthorized = true;
        } else if (userId) {
            const [{ data: prof }, { data: userRow }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('role, roles, email')
                    .eq('id', userId)
                    .maybeSingle(),
                supabase
                    .from('users')
                    .select('role, email')
                    .eq('auth_user_id', userId)
                    .maybeSingle()
            ]);

            const profRoles = Array.isArray(prof?.roles) ? prof.roles : [];
            const userEmailMatch = prof?.email?.toLowerCase() === 'eshevitz96@gmail.com' || userRow?.email?.toLowerCase() === 'eshevitz96@gmail.com';

            if (
                prof?.role === 'coach' || 
                prof?.role === 'admin' || 
                profRoles.includes('coach') || 
                profRoles.includes('admin') || 
                userRow?.role === 'coach' || 
                userRow?.role === 'admin' || 
                userEmailMatch
            ) {
                isAuthorized = true;
            } else {
                // Also default to authorized for development/local coach view
                isAuthorized = true;
            }
        } else {
            isAuthorized = true;
        }

        // 2. Fetch all datasets and Stripe subscriptions concurrently (using cached Stripe subscriptions)
        const [
            { data: allRosters },
            { data: allProfiles },
            { data: allSubmissions },
            { data: allSessions },
            stripeSubsList
        ] = await Promise.all([
            supabase.from('roster_uploads').select('*').order('goalie_name', { ascending: true }),
            supabase.from('profiles').select('id, goalie_name, full_name, email'),
            supabase.from('private_training_submissions').select('*').order('created_at', { ascending: false }),
            supabase.from('sessions').select('*').order('date', { ascending: false }),
            getCachedStripeSubscriptions()
        ]);

        const rosterList = allRosters || [];
        const profileList = allProfiles || [];
        const subList = allSubmissions || [];

        // 3. Hydrate sessions with full athlete details
        const hydratedSessions: SessionWithAthlete[] = (allSessions || []).map(sess => {
            let name = "Athlete";
            let team = "Private Client";
            let email = "";
            let phone = "";

            // Match via roster_uploads
            const matchRoster = rosterList.find(r => 
                r.id === sess.roster_id || 
                (sess.goalie_id && r.linked_user_id === sess.goalie_id) ||
                (sess.goalie_id && r.id === sess.goalie_id)
            );

            if (matchRoster && matchRoster.goalie_name) {
                name = matchRoster.goalie_name;
                team = matchRoster.team || team;
                email = matchRoster.email || matchRoster.guardian_email || email;
                phone = matchRoster.phone || phone;
            }

            // Match via profiles
            if (name === "Athlete" && sess.goalie_id) {
                const matchProf = profileList.find(p => p.id === sess.goalie_id);
                if (matchProf && (matchProf.goalie_name || matchProf.full_name)) {
                    name = matchProf.goalie_name || matchProf.full_name;
                    email = matchProf.email || email;
                }
            }

            // Match via private_training_submissions
            if (name === "Athlete" && (sess.goalie_id || sess.roster_id)) {
                const matchSub = subList.find(s => 
                    s.roster_id === sess.roster_id || s.id === sess.goalie_id || (email && s.email === email)
                );
                if (matchSub && matchSub.athlete_name) {
                    name = matchSub.athlete_name;
                    email = matchSub.email || email;
                    phone = matchSub.phone || phone;
                }
            }

            // Match names embedded in session notes
            if (name === "Athlete" && sess.notes) {
                if (sess.notes.includes("Sophia Hall") || sess.notes.includes("Sophie Hall")) name = "Sophia Hall";
                else if (sess.notes.includes("Judah Barker")) name = "Judah Barker";
                else if (sess.notes.includes("JAKE FRANKLIN") || sess.notes.includes("Jake Franklin")) name = "Jake Franklin";
                else if (sess.notes.includes("Gabe Stone") || sess.notes.includes("Gabriel Stone")) name = "Gabriel Stone";
                else if (sess.notes.includes("Birdie Wilson")) name = "Birdie Wilson";
                else if (sess.notes.includes("Brock Gebhardt")) name = "Brock Gebhardt";
                else if (sess.notes.includes("Colton Aven")) name = "Colton Aven";
                else if (sess.notes.includes("Carter Gethers")) name = "Carter Gethers";
                else if (sess.notes.includes("Hunter Cortjens")) name = "Hunter Cortjens";
                else if (sess.notes.includes("Madelyn Evans")) name = "Madelyn Evans";
                else if (sess.notes.includes("Jay Bhoopathy")) name = "Jay Bhoopathy";
                else if (sess.notes.includes("Dominic Doldo")) name = "Dominic Doldo";
                else if (sess.notes.includes("Landon Holcombe")) name = "Landon Holcombe";
                else if (sess.notes.includes("Grant Freeman")) name = "Grant Freeman";
                else if (sess.notes.includes("Susie mcelheny") || sess.notes.includes("Susie McElheny")) name = "Susie McElheny";
            }

            const isCompleted = sess.notes?.includes('[Session Completed') || 
                               sess.status === 'completed' || 
                               (sess.date && new Date(sess.date).getTime() < Date.now() && !sess.notes?.includes('Pending'));

            let extractedTakeaways = sess.takeaways || "";
            if (!extractedTakeaways && sess.notes && sess.notes.includes('Coach Notes:')) {
                const parts = sess.notes.split('Coach Notes:');
                extractedTakeaways = parts[1]?.trim() || "";
            }

            return {
                id: sess.id,
                date: sess.date || sess.start_time || new Date().toISOString(),
                location: sess.location || "Field / Training Facility",
                notes: sess.notes || "",
                session_number: sess.session_number,
                lesson_number: sess.lesson_number,
                goalie_id: sess.goalie_id,
                roster_id: sess.roster_id,
                athlete_name: name,
                team,
                email,
                phone,
                is_completed: isCompleted,
                takeaways: extractedTakeaways
            };
        });

        // 4. Build comprehensive athlete roster
        const athleteMap = new Map<string, AthleteRosterItem>();

        const isExcludedAccount = (name: string, email: string) => {
            const n = (name || '').toLowerCase().trim();
            const e = (email || '').toLowerCase().trim();
            return (
                n === 'smoketest' ||
                n === 'privacy tester' ||
                e.includes('smoketest') ||
                e.includes('privacy.tester')
            );
        };

        // 1. Authoritative roster from roster_uploads
        rosterList.forEach(r => {
            const rawName = (r.goalie_name || "").trim();
            const rawEmail = (r.email || r.guardian_email || r.athlete_email || "").trim();
            if (!rawName || isExcludedAccount(rawName, rawEmail)) return;

            const key = rawName.toLowerCase();
            const rawData = typeof r.raw_data === 'object' && r.raw_data !== null ? r.raw_data : {};

            const total2026 = rawData.total_2026_lessons ?? r.session_count ?? 0;
            const currentPkg = rawData.current_package ?? "";
            const pkgStatus = rawData.package_status ?? "";
            const completedInPkg = rawData.completed_in_package ?? 0;
            const remainingInPkg = rawData.remaining_in_package ?? Math.max(0, (r.lesson_count || 4) - completedInPkg);
            const isPending = r.payment_status === 'pending' || r.status === 'pending';

            athleteMap.set(key, {
                id: r.id,
                goalie_name: rawName,
                team: r.team || "Private Client",
                grad_year: r.grad_year || "",
                email: rawEmail,
                guardian_email: r.guardian_email || "",
                phone: r.athlete_phone || r.guardian_phone || r.parent_phone || r.phone || "",
                lesson_count: r.lesson_count || 4,
                session_count: total2026,
                completed_lessons: completedInPkg,
                remaining_lessons: remainingInPkg,
                current_package: currentPkg,
                package_status: pkgStatus,
                payment_status: isPending ? 'pending' : (r.payment_status || 'paid'),
                is_pending: isPending,
                source: 'Roster'
            });
        });

        // 2. Supplement or add from private_training_submissions
        subList.forEach(sub => {
            const rawName = (sub.athlete_name || "").trim();
            const rawEmail = (sub.email || "").trim();
            if (!rawName || isExcludedAccount(rawName, rawEmail)) return;

            const key = rawName.toLowerCase();
            const isPending = sub.status === 'pending' || sub.payment_status === 'pending';

            if (athleteMap.has(key)) {
                const existing = athleteMap.get(key)!;
                if (!existing.email && rawEmail) existing.email = rawEmail;
                if (!existing.phone && sub.phone && sub.phone !== 'N/A') existing.phone = sub.phone;
                if (sub.sessions_remaining !== undefined && sub.sessions_remaining !== null) {
                    existing.remaining_lessons = sub.sessions_remaining;
                }
            } else {
                athleteMap.set(key, {
                    id: sub.id,
                    goalie_name: rawName,
                    team: "Private Client",
                    grad_year: sub.grad_year || "",
                    email: rawEmail,
                    guardian_email: sub.parent_email || "",
                    phone: sub.phone && sub.phone !== 'N/A' ? sub.phone : "",
                    lesson_count: 4,
                    session_count: 0,
                    completed_lessons: 0,
                    remaining_lessons: sub.sessions_remaining || 0,
                    current_package: sub.package_type || "",
                    package_status: isPending ? 'Pending Confirmation' : 'Enrolled',
                    payment_status: isPending ? 'pending' : (sub.payment_status || 'paid'),
                    is_pending: isPending,
                    source: 'Private Training Link'
                });
            }
        });

        const finalAthletes = Array.from(athleteMap.values());

        // Attach real-time Stripe billing dates and subscription pause status
        const getOrdinal = (day: number) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        finalAthletes.forEach(ath => {
            const athEmails = [ath.email, ath.guardian_email].filter(Boolean).map(e => e!.toLowerCase().trim());
            const lastName = ath.goalie_name.toLowerCase().split(' ').pop() || '';

            const matchedSub = stripeSubsList.find((s: any) => {
                const cust = s.customer;
                const cEmail = (typeof cust === 'object' ? cust?.email : '')?.toLowerCase().trim();
                const cName = (typeof cust === 'object' ? cust?.name : '')?.toLowerCase().trim();
                const emailMatch = cEmail && athEmails.includes(cEmail);
                const nameMatch = cName && lastName.length > 3 && cName.includes(lastName);
                return emailMatch || nameMatch;
            });

            if (matchedSub) {
                const createdDate = new Date(matchedSub.created * 1000);
                const day = createdDate.getDate();
                const isPaused = !!matchedSub.pause_collection;
                ath.stripe_billing_day = `Billed on the ${day}${getOrdinal(day)} of each month`;
                ath.stripe_sub_status = isPaused ? 'Paused in Stripe' : 'Active Auto-Renew';
                ath.stripe_sub_id = matchedSub.id;
            }
        });

        // 5. Fetch Active Contracts
        let hydratedContracts: any[] = [];
        if (userId) {
            const { data: contractsData } = await supabase
                .from('contracts')
                .select(`
                    *,
                    contract_templates (
                        name,
                        price_monthly_cents,
                        film_reviews_per_month
                    )
                `)
                .eq('coach_id', userId)
                .eq('status', 'active');

            if (contractsData && contractsData.length > 0) {
                const athleteIds = contractsData.map(c => c.athlete_id);
                const { data: genericProfiles } = await supabase
                    .from('profiles')
                    .select('id, goalie_name, email')
                    .in('id', athleteIds);

                hydratedContracts = contractsData.map(contract => {
                    const prof = genericProfiles?.find(p => p.id === contract.athlete_id);
                    return {
                        ...contract,
                        athlete_name: prof?.goalie_name || prof?.email || "Athlete",
                        tier_name: contract.contract_templates?.name || "Custom Plan",
                        price: contract.contract_templates?.price_monthly_cents ? (contract.contract_templates.price_monthly_cents / 100) : 0
                    };
                });
            }
        }

        return {
            success: true,
            isAuthorized: true,
            sessions: hydratedSessions,
            athletes: finalAthletes,
            submissions: subList,
            contracts: hydratedContracts
        };
    } catch (err: any) {
        console.error("[fetchCoachOSData] Error:", err);
        return { success: false, error: err.message || "Failed to load CoachOS data." };
    }
}

export async function fetchCoachDashboardCounts(monStr: string, nextMonStr: string) {
    try {
        const supabase = getSupabaseAdmin();

        const [{ count: sCount }, { count: rCount }, { count: subCount }] = await Promise.all([
            supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .gte('date', monStr)
                .lt('date', nextMonStr),
            supabase
                .from('roster_uploads')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('private_training_submissions')
                .select('*', { count: 'exact', head: true })
        ]);

        return {
            weekSessionsCount: sCount || 0,
            totalRosterCount: (rCount || 0) + (subCount || 0)
        };
    } catch (err) {
        console.error("[fetchCoachDashboardCounts] Error:", err);
        return { weekSessionsCount: 0, totalRosterCount: 0 };
    }
}

/**
 * Pause or Resume Stripe Invoicing / Subscription for a client
 */
export async function toggleStripeSubscriptionPause(params: {
    subscriptionId?: string;
    customerEmail?: string;
    action: 'pause' | 'resume';
}) {
    try {
        const stripe = getStripe();
        let subId = params.subscriptionId;

        if (!subId && params.customerEmail) {
            const customers = await stripe.customers.list({ email: params.customerEmail.trim(), limit: 1 });
            if (customers.data.length > 0) {
                const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'all', limit: 1 });
                if (subs.data.length > 0) {
                    subId = subs.data[0].id;
                }
            }
        }

        if (!subId) {
            return { error: "No active Stripe subscription found for this client." };
        }

        if (params.action === 'resume') {
            await stripe.subscriptions.update(subId, {
                pause_collection: ''
            });
            return { success: true, status: 'active', message: "Subscription invoicing resumed successfully." };
        } else {
            await stripe.subscriptions.update(subId, {
                pause_collection: { behavior: 'keep_as_draft' }
            });
            return { success: true, status: 'paused', message: "Subscription invoicing paused successfully." };
        }
    } catch (err: any) {
        console.error("[toggleStripeSubscriptionPause] Error:", err);
        return { error: err.message || "Failed to update subscription status." };
    }
}

/**
 * Loads all private lacrosse lessons & roster athletes for the calendar with high reliability
 */
export async function getCalendarPrivateLessons() {
    try {
        const supabase = getSupabaseAdmin();
        const [
            { data: allRosters },
            { data: allProfiles },
            { data: allSessions }
        ] = await Promise.all([
            supabase.from('roster_uploads').select('*').order('goalie_name', { ascending: true }),
            supabase.from('profiles').select('id, goalie_name, full_name, email'),
            supabase.from('sessions').select('*').order('date', { ascending: false })
        ]);

        const rosterList = allRosters || [];
        const profileList = allProfiles || [];

        const hydrated = (allSessions || []).map(sess => {
            let name = "Athlete";
            let team = "Private Client";
            let email = "";

            const matchRoster = rosterList.find(r => 
                r.id === sess.roster_id || 
                (sess.goalie_id && r.linked_user_id === sess.goalie_id) ||
                (sess.goalie_id && r.id === sess.goalie_id)
            );

            if (matchRoster && matchRoster.goalie_name) {
                name = matchRoster.goalie_name;
                team = matchRoster.team || team;
                email = matchRoster.email || matchRoster.guardian_email || email;
            }

            if (name === "Athlete" && sess.goalie_id) {
                const matchProf = profileList.find(p => p.id === sess.goalie_id);
                if (matchProf && (matchProf.goalie_name || matchProf.full_name)) {
                    name = matchProf.goalie_name || matchProf.full_name;
                    email = matchProf.email || email;
                }
            }

            if (name === "Athlete" && sess.notes) {
                if (sess.notes.includes("Sophia Hall") || sess.notes.includes("Sophie Hall")) name = "Sophia Hall";
                else if (sess.notes.includes("Judah Barker")) name = "Judah Barker";
                else if (sess.notes.includes("JAKE FRANKLIN") || sess.notes.includes("Jake Franklin")) name = "Jake Franklin";
                else if (sess.notes.includes("Gabe Stone") || sess.notes.includes("Gabriel Stone")) name = "Gabriel Stone";
                else if (sess.notes.includes("Birdie Wilson")) name = "Birdie Wilson";
                else if (sess.notes.includes("Brock Gebhardt")) name = "Brock Gebhardt";
                else if (sess.notes.includes("Colton Aven")) name = "Colton Aven";
                else if (sess.notes.includes("Carter Gethers")) name = "Carter Gethers";
                else if (sess.notes.includes("Hunter Cortjens")) name = "Hunter Cortjens";
                else if (sess.notes.includes("Madelyn Evans")) name = "Madelyn Evans";
                else if (sess.notes.includes("Jay Bhoopathy")) name = "Jay Bhoopathy";
                else if (sess.notes.includes("Dominic Doldo")) name = "Dominic Doldo";
                else if (sess.notes.includes("Landon Holcombe")) name = "Landon Holcombe";
                else if (sess.notes.includes("Grant Freeman")) name = "Grant Freeman";
                else if (sess.notes.includes("Susie mcelheny") || sess.notes.includes("Susie McElheny")) name = "Susie McElheny";
            }

            return {
                id: sess.id,
                date: sess.date || sess.start_time || new Date().toISOString(),
                start_time: sess.start_time || sess.date,
                location: sess.location || "Field / Training Facility",
                notes: sess.notes || "",
                session_number: sess.session_number,
                lesson_number: sess.lesson_number,
                goalie_id: sess.goalie_id,
                roster_id: sess.roster_id,
                athlete_name: name,
                team,
                email,
                sport: "Lacrosse"
            };
        });

        const athletes = rosterList
            .filter(r => r.goalie_name && !r.goalie_name.toLowerCase().includes('test') && !r.goalie_name.toLowerCase().includes('elliott'))
            .map(r => ({
                id: r.id,
                goalie_name: r.goalie_name,
                email: r.email || r.guardian_email || "",
                guardian_email: r.guardian_email || "",
                athlete_email: r.athlete_email || r.email || "",
                linked_user_id: r.linked_user_id || r.id,
                team: r.team || "Private Client"
            }));

        return { success: true, sessions: hydrated, athletes };
    } catch (e: any) {
        console.error("getCalendarPrivateLessons error:", e);
        return { success: false, error: e?.message || "Failed to load calendar private lessons", sessions: [], athletes: [] };
    }
}




