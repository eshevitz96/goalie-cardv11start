import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateICSFeed, ICalEvent } from "@/lib/ical";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("Supabase Admin Configuration Missing");
    }
    return createClient(url, key);
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') || 'all'; // 'all' | 'week' | 'upcoming'

        // 1. Fetch sessions, roster uploads, and private submissions
        const [
            { data: sessions },
            { data: rosters },
            { data: submissions }
        ] = await Promise.all([
            supabase.from('sessions').select('*').order('date', { ascending: true }),
            supabase.from('roster_uploads').select('id, goalie_name, email, phone, linked_user_id'),
            supabase.from('private_training_submissions').select('id, athlete_name, email, phone, roster_id')
        ]);

        const rosterList = rosters || [];
        const subList = submissions || [];

        const now = new Date();
        const mondayStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        mondayStart.setDate(now.getDate() - daysSinceMon);
        mondayStart.setHours(0, 0, 0, 0);

        const sundayEnd = new Date(mondayStart);
        sundayEnd.setDate(mondayStart.getDate() + 6);
        sundayEnd.setHours(23, 59, 59, 999);

        const events: ICalEvent[] = [];

        (sessions || []).forEach(sess => {
            const sessDate = new Date(sess.date || sess.start_time);
            if (isNaN(sessDate.getTime())) return;

            // Scope filter
            if (scope === 'week') {
                if (sessDate.getTime() < mondayStart.getTime() || sessDate.getTime() > sundayEnd.getTime()) {
                    return;
                }
            } else if (scope === 'march2026') {
                if (sessDate.getTime() < new Date('2026-03-01T00:00:00').getTime()) {
                    return;
                }
            } else if (scope === 'upcoming') {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                if (sessDate.getTime() < todayStart.getTime()) {
                    return;
                }
            }

            // Athlete identification
            let athleteName = "Private Client";
            let athleteEmail = "";

            const matchRoster = rosterList.find(r => 
                r.id === sess.roster_id || 
                (sess.goalie_id && r.linked_user_id === sess.goalie_id) ||
                (sess.goalie_id && r.id === sess.goalie_id)
            );
            if (matchRoster && matchRoster.goalie_name) {
                athleteName = matchRoster.goalie_name;
                athleteEmail = matchRoster.email || "";
            }

            const matchSub = subList.find(s => 
                s.roster_id === sess.roster_id || s.id === sess.goalie_id || (athleteEmail && s.email === athleteEmail)
            );
            if (matchSub && matchSub.athlete_name) {
                athleteName = matchSub.athlete_name;
                athleteEmail = matchSub.email || athleteEmail;
            }

            // Fallback from notes
            if (athleteName === "Private Client" && sess.notes) {
                if (sess.notes.includes("Sophia Hall") || sess.notes.includes("Sophie Hall")) athleteName = "Sophia Hall";
                else if (sess.notes.includes("Judah Barker")) athleteName = "Judah Barker";
                else if (sess.notes.includes("Jake Franklin") || sess.notes.includes("JAKE FRANKLIN")) athleteName = "Jake Franklin";
                else if (sess.notes.includes("Gabe Stone") || sess.notes.includes("Gabriel Stone")) athleteName = "Gabriel Stone";
                else if (sess.notes.includes("Birdie Wilson")) athleteName = "Birdie Wilson";
                else if (sess.notes.includes("Brock Gebhardt")) athleteName = "Brock Gebhardt";
                else if (sess.notes.includes("Colton Aven")) athleteName = "Colton Aven";
                else if (sess.notes.includes("Carter Gethers")) athleteName = "Carter Gethers";
                else if (sess.notes.includes("Hunter Cortjens")) athleteName = "Hunter Cortjens";
                else if (sess.notes.includes("Madelyn Evans")) athleteName = "Madelyn Evans";
                else if (sess.notes.includes("Jay Bhoopathy")) athleteName = "Jay Bhoopathy";
                else if (sess.notes.includes("Dominic Doldo")) athleteName = "Dominic Doldo";
                else if (sess.notes.includes("Landon Holcombe")) athleteName = "Landon Holcombe";
                else if (sess.notes.includes("Grant Freeman")) athleteName = "Grant Freeman";
                else if (sess.notes.includes("Susie mcelheny") || sess.notes.includes("Susie McElheny")) athleteName = "Susie McElheny";
            }

            const isCompleted = sess.notes?.includes('[Session Completed') || sess.status === 'completed';
            const location = sess.location || "Training Facility / Field";
            const numParts = [
                sess.session_number ? `S${sess.session_number}` : '',
                sess.lesson_number ? `L${sess.lesson_number}` : ''
            ].filter(Boolean).join(', ');
            const lessonNumStr = numParts ? ` (${numParts})` : '';

            let desc = `Goalie Card Private Training Lesson with ${athleteName}${lessonNumStr}.\nLocation: ${location}\nStatus: ${isCompleted ? 'Completed' : 'Confirmed'}`;
            if (sess.notes) {
                desc += `\n\nNotes: ${sess.notes}`;
            }

            events.push({
                id: sess.id,
                title: `Private Lesson: ${athleteName}${lessonNumStr}`,
                description: desc,
                location,
                startDate: sessDate,
                endDate: new Date(sessDate.getTime() + 60 * 60 * 1000), // 1 hour lesson duration
                athleteName,
                athleteEmail,
                coachEmail: "eshevitz96@gmail.com",
                status: isCompleted ? "COMPLETED" : "CONFIRMED"
            });
        });

        const icsContent = generateICSFeed(events, "GoalieCard - Coach Schedule");

        return new NextResponse(icsContent, {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="goaliecard-coach-schedule-${scope}.ics"`,
                "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate"
            }
        });
    } catch (err: any) {
        console.error("[export-ical] Error:", err);
        return NextResponse.json({ error: err.message || "Failed to generate iCal" }, { status: 500 });
    }
}
