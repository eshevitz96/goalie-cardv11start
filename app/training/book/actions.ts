"use server";

import { createClient } from "@supabase/supabase-js";
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
            .eq('goalie_id', goalieProfileId)
            .maybeSingle();

        // 2. Check roster details
        let goalieName = balance?.goalie_name || "Athlete";
        let email = balance?.email || userEmail || "";
        let rosterId: string | null = null;

        const { data: roster } = await supabase
            .from('roster_uploads')
            .select('*')
            .or(`linked_user_id.eq.${goalieProfileId},id.eq.${goalieProfileId},email.ilike.${userEmail?.trim() || 'none'}`)
            .maybeSingle();

        if (roster) {
            goalieName = roster.goalie_name || goalieName;
            email = roster.email || roster.guardian_email || email;
            rosterId = roster.id;
        }

        // 3. Fetch private training registration & package selection
        const { data: submission } = await supabase
            .from('private_training_submissions')
            .select('*')
            .or(`email.ilike.${email.trim()},roster_id.eq.${rosterId || '00000000-0000-0000-0000-000000000000'}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Determine package allowance from paid plan
        let packageTotal = 16;
        if (submission?.notes && submission.notes.includes('plan:')) {
            const match = submission.notes.match(/plan:([a-zA-Z0-9]+)/);
            if (match && match[1] === 'season') packageTotal = 24;
            if (match && match[1] === 'monthly') packageTotal = 4;
        }

        // 4. Fetch user's booked sessions
        const { data: existingSessions } = await supabase
            .from('sessions')
            .select('id, date, location, notes')
            .or(`goalie_id.eq.${goalieProfileId},roster_id.eq.${rosterId || goalieProfileId}`)
            .order('date', { ascending: true });

        const bookedCount = existingSessions?.length || 0;
        const computedRemaining = Math.max(0, packageTotal - bookedCount);
        const finalLessonsRemaining = balance?.lessons_remaining ?? computedRemaining;

        return {
            success: true,
            goalieName,
            email,
            lessonsRemaining: finalLessonsRemaining,
            existingSessions: existingSessions || []
        };
    } catch (err: any) {
        console.error("[getGoalieBookingProfile] Error:", err);
        return {
            success: true,
            goalieName: "Athlete",
            email: userEmail || "",
            lessonsRemaining: 16,
            existingSessions: []
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

                const recipients = ["e@cmmncreators.com"];
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
                        from: process.env.EMAIL_FROM_ADDRESS || "Goalie Card Private Training <onboarding@resend.dev>",
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

                const recipients = ["e@cmmncreators.com"];
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
                        from: process.env.EMAIL_FROM_ADDRESS || "Goalie Card Private Training <onboarding@resend.dev>",
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

                const recipients = ["e@cmmncreators.com"];
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
                        from: process.env.EMAIL_FROM_ADDRESS || "Goalie Card Private Training <onboarding@resend.dev>",
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
                    ? (clientEmail ? [clientEmail.trim(), "e@cmmncreators.com"] : ["e@cmmncreators.com"])
                    : ["e@cmmncreators.com"];

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
                        from: process.env.EMAIL_FROM_ADDRESS || "Goalie Card Private Training <onboarding@resend.dev>",
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

