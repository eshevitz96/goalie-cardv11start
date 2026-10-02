"use server";

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { verifyCoachAuthorization } from '@/app/training/book/actions';
import type { GameReport, Clip, Shot, ShotTypeType, SportType } from '@/types/game';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("Missing Supabase Service Role configuration");
    }
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

/**
 * Extracts storage path from either a relative path (e.g. "user_id/clip.mp4")
 * or a legacy public URL (e.g. "https://.../storage/v1/object/public/game-film/user_id/clip.mp4").
 */
function extractStoragePath(bucket: string, pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) return '';
    if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
        return pathOrUrl.replace(/^\/+/, '');
    }
    try {
        const urlObj = new URL(pathOrUrl);
        const marker = `/${bucket}/`;
        const idx = urlObj.pathname.indexOf(marker);
        if (idx !== -1) {
            return decodeURIComponent(urlObj.pathname.substring(idx + marker.length));
        }
        const parts = urlObj.pathname.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
    } catch {
        return pathOrUrl;
    }
}

/**
 * Generates a short-lived signed URL for game film or reflection attachments.
 * STRICT ROW-BASED AUTHORIZATION & PATH SANITIZATION:
 * 1. Require clipId, eventId, or reflectionId to verify row-level permissions.
 * 2. Lookup DB row by ID only (no client-supplied path queries, no .or() injection).
 * 3. Sign the path stored in the DB row, NEVER the client-supplied path.
 * 4. Events branch: coach access only if shared_with_coach = true or created_by is coach.
 * 5. Direct path fallback allowed ONLY if path strictly starts with `${user.id}/` AND contains no "..", "%", or commas.
 */
export async function getSignedMediaUrl(
    bucket: 'game-film' | 'reflection-attachments',
    pathOrUrl?: string | null,
    options?: { clipId?: string; reflectionId?: string; eventId?: string }
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
    try {
        const supabaseServer = await createServerSupabase();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const supabaseAdmin = getSupabaseAdmin();
        let targetStoragePath: string | null = null;

        if (bucket === 'game-film') {
            // Priority 1: Look up by clipId
            if (options?.clipId) {
                const { data: clip, error: clipErr } = await supabaseAdmin
                    .from('film_clips')
                    .select('id, user_id, shared_with_coach, url')
                    .eq('id', options.clipId)
                    .maybeSingle();

                if (clipErr || !clip) {
                    return { success: false, error: "Clip not found or access denied" };
                }

                const isOwner = clip.user_id === user.id;
                let isCoachShared = false;

                if (!isOwner && clip.shared_with_coach === true) {
                    const coachAuth = await verifyCoachAuthorization();
                    isCoachShared = coachAuth.isAuthorized;
                }

                if (!isOwner && !isCoachShared) {
                    return { success: false, error: "Unauthorized: Access to this film clip is restricted" };
                }

                targetStoragePath = extractStoragePath('game-film', clip.url);
                if (targetStoragePath.includes('..') || targetStoragePath.includes('%') || targetStoragePath.includes(',') || targetStoragePath.includes('\\')) {
                    return { success: false, error: "Unauthorized: Invalid storage path detected" };
                }
            }
            // Priority 2: Look up by eventId
            else if (options?.eventId) {
                const { data: event, error: eventErr } = await supabaseAdmin
                    .from('events')
                    .select('id, created_by, roster_id, video_url, shared_with_coach')
                    .eq('id', options.eventId)
                    .maybeSingle();

                if (eventErr || !event) {
                    return { success: false, error: "Event not found or access denied" };
                }

                const isCreator = event.created_by === user.id;
                let isAssignedGoalie = false;

                // Goalie access for coach-created recap events: events.roster_id -> roster_uploads.linked_user_id
                if (!isCreator && event.roster_id) {
                    const { data: roster } = await supabaseAdmin
                        .from('roster_uploads')
                        .select('id, linked_user_id, email, user_id')
                        .eq('id', event.roster_id)
                        .maybeSingle();

                    if (roster && (roster.linked_user_id === user.id || roster.user_id === user.id || (roster.email && roster.email.toLowerCase() === user.email?.toLowerCase()))) {
                        isAssignedGoalie = true;
                    }
                }

                let isCoachAuthorized = false;
                if (!isCreator && !isAssignedGoalie) {
                    const coachAuth = await verifyCoachAuthorization();
                    if (coachAuth.isAuthorized) {
                        // Coach can view if coach created it OR if goalie shared it with coach
                        if (event.created_by === coachAuth.userId || event.shared_with_coach === true) {
                            isCoachAuthorized = true;
                        }
                    }
                }

                if (!isCreator && !isAssignedGoalie && !isCoachAuthorized) {
                    return { success: false, error: "Unauthorized: Event video is private to athlete" };
                }

                targetStoragePath = extractStoragePath('game-film', event.video_url);
                if (targetStoragePath.includes('..') || targetStoragePath.includes('%') || targetStoragePath.includes(',') || targetStoragePath.includes('\\')) {
                    return { success: false, error: "Unauthorized: Invalid storage path detected" };
                }
            }
            // Priority 3: Strict direct path check (only within caller's own user folder)
            else if (pathOrUrl) {
                const cleanPath = extractStoragePath('game-film', pathOrUrl);
                const hasTraversal = cleanPath.includes('..') || cleanPath.includes('%') || cleanPath.includes(',') || cleanPath.includes('\\');
                const isUserFolder = cleanPath.startsWith(`${user.id}/`);

                if (!isUserFolder || hasTraversal) {
                    return { success: false, error: "Unauthorized: Invalid path or missing clipId/eventId" };
                }

                targetStoragePath = cleanPath;
            } else {
                return { success: false, error: "Missing clipId, eventId, or valid storage path" };
            }

            if (!targetStoragePath) {
                return { success: false, error: "No valid video storage path found" };
            }

            // Generate 1-hour signed URL (3600 seconds)
            const { data: signedData, error: signError } = await supabaseAdmin.storage
                .from('game-film')
                .createSignedUrl(targetStoragePath, 3600);

            if (signError || !signedData?.signedUrl) {
                console.error("[getSignedMediaUrl] Storage sign error:", signError);
                return { success: false, error: signError?.message || "Failed to generate signed URL" };
            }

            return { success: true, signedUrl: signedData.signedUrl };
        }

        if (bucket === 'reflection-attachments') {
            if (options?.reflectionId) {
                const { data: ref, error: refErr } = await supabaseAdmin
                    .from('reflections')
                    .select('id, author_id, roster_id, file_url, shared_with_coach')
                    .eq('id', options.reflectionId)
                    .maybeSingle();

                if (refErr || !ref) {
                    return { success: false, error: "Attachment not found or access denied" };
                }

                const isAuthor = ref.author_id === user.id;
                let isAssignedGoalie = false;

                if (!isAuthor && ref.roster_id) {
                    const { data: roster } = await supabaseAdmin
                        .from('roster_uploads')
                        .select('id, linked_user_id, email, user_id')
                        .eq('id', ref.roster_id)
                        .maybeSingle();

                    if (roster && (roster.linked_user_id === user.id || roster.user_id === user.id || (roster.email && roster.email.toLowerCase() === user.email?.toLowerCase()))) {
                        isAssignedGoalie = true;
                    }
                }

                let isCoach = false;
                // Coach sees reflection attachment ONLY if shared_with_coach is true
                if (!isAuthor && !isAssignedGoalie && ref.shared_with_coach === true) {
                    const coachAuth = await verifyCoachAuthorization();
                    isCoach = coachAuth.isAuthorized;
                }

                if (!isAuthor && !isAssignedGoalie && !isCoach) {
                    return { success: false, error: "Unauthorized: Attachment is private" };
                }

                targetStoragePath = extractStoragePath('reflection-attachments', ref.file_url);
                if (targetStoragePath.includes('..') || targetStoragePath.includes('%') || targetStoragePath.includes(',') || targetStoragePath.includes('\\')) {
                    return { success: false, error: "Unauthorized: Invalid storage path detected" };
                }
            } else if (pathOrUrl) {
                const cleanPath = extractStoragePath('reflection-attachments', pathOrUrl);
                const hasTraversal = cleanPath.includes('..') || cleanPath.includes('%') || cleanPath.includes(',') || cleanPath.includes('\\');
                const isUserFolder = cleanPath.startsWith(`${user.id}/`);

                if (!isUserFolder || hasTraversal) {
                    return { success: false, error: "Unauthorized: Invalid path or missing reflectionId" };
                }

                targetStoragePath = cleanPath;
            } else {
                return { success: false, error: "Missing reflectionId or storage path" };
            }

            if (!targetStoragePath) {
                return { success: false, error: "No valid attachment path found" };
            }

            const { data: signedData, error: signError } = await supabaseAdmin.storage
                .from('reflection-attachments')
                .createSignedUrl(targetStoragePath, 3600);

            if (signError || !signedData?.signedUrl) {
                console.error("[getSignedMediaUrl] Storage sign error:", signError);
                return { success: false, error: signError?.message || "Failed to generate signed URL" };
            }

            return { success: true, signedUrl: signedData.signedUrl };
        }

        return { success: false, error: "Unsupported bucket" };
    } catch (err: any) {
        console.error("[getSignedMediaUrl] Unexpected error:", err);
        return { success: false, error: err.message || "Failed to generate signed URL" };
    }
}

/**
 * Toggles whether a reflection is shared with the coach.
 * Strictly verifies that the authenticated user authored the reflection.
 */
export async function toggleReflectionShareWithCoach(
    reflectionId: string,
    shared: boolean
): Promise<{ success: boolean; shared?: boolean; error?: string }> {
    try {
        if (!reflectionId) return { success: false, error: "Missing reflection ID" };

        const supabaseServer = await createServerSupabase();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data: ref, error: findError } = await supabaseAdmin
            .from('reflections')
            .select('id, author_id')
            .eq('id', reflectionId)
            .maybeSingle();

        if (findError || !ref) {
            return { success: false, error: "Reflection not found" };
        }

        if (ref.author_id !== user.id) {
            return { success: false, error: "Forbidden: You do not own this reflection" };
        }

        const { error: updateError } = await supabaseAdmin
            .from('reflections')
            .update({ shared_with_coach: shared })
            .eq('id', reflectionId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true, shared };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Toggles whether an event's video is shared with the coach.
 * Strictly verifies that the authenticated user created the event.
 */
export async function toggleEventShareWithCoach(
    eventId: string,
    shared: boolean
): Promise<{ success: boolean; shared?: boolean; error?: string }> {
    try {
        if (!eventId) return { success: false, error: "Missing event ID" };

        const supabaseServer = await createServerSupabase();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data: event, error: findError } = await supabaseAdmin
            .from('events')
            .select('id, created_by')
            .eq('id', eventId)
            .maybeSingle();

        if (findError || !event) {
            return { success: false, error: "Event not found" };
        }

        if (event.created_by !== user.id) {
            return { success: false, error: "Forbidden: You do not own this event" };
        }

        const { error: updateError } = await supabaseAdmin
            .from('events')
            .update({ shared_with_coach: shared })
            .eq('id', eventId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true, shared };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Toggles whether a film clip is shared with the coach.
 * Strictly verifies that the authenticated user owns the clip.
 */
export async function toggleClipShareWithCoach(
    clipId: string,
    shared: boolean
): Promise<{ success: boolean; shared?: boolean; error?: string }> {
    try {
        if (!clipId) return { success: false, error: "Missing clip ID" };

        const supabaseServer = await createServerSupabase();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Verify caller owns the clip
        const { data: clip, error: findError } = await supabaseAdmin
            .from('film_clips')
            .select('id, user_id')
            .eq('id', clipId)
            .maybeSingle();

        if (findError || !clip) {
            return { success: false, error: "Clip not found" };
        }

        if (clip.user_id !== user.id) {
            return { success: false, error: "Forbidden: You do not own this clip" };
        }

        // 2. Update shared_with_coach column
        const { error: updateError } = await supabaseAdmin
            .from('film_clips')
            .update({ shared_with_coach: shared })
            .eq('id', clipId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error("[toggleClipShareWithCoach] Update error:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, shared };
    } catch (err: any) {
        console.error("[toggleClipShareWithCoach] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Fetches game reports and clips with server-side access control:
 * - Goalie: receives ONLY their own reports and clips (both shared and unshared).
 * - Coach: receives ONLY reports and clips where shared_with_coach = true.
 * Generates signed URLs for all delivered clips.
 */
export async function fetchFilmReports(): Promise<{
    success: boolean;
    reports?: GameReport[];
    isCoachView?: boolean;
    error?: string;
}> {
    try {
        const supabaseServer = await createServerSupabase();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const coachAuth = await verifyCoachAuthorization();
        const isCoach = coachAuth.isAuthorized;
        const supabaseAdmin = getSupabaseAdmin();

        let reportsData: any[] = [];
        let clipsData: any[] = [];
        let shotsData: any[] = [];

        if (isCoach) {
            // Coach sees only clips that athletes explicitly shared
            const { data: sharedClips, error: clipsError } = await supabaseAdmin
                .from('film_clips')
                .select('*')
                .eq('shared_with_coach', true)
                .order('created_at', { ascending: false });

            if (clipsError) throw clipsError;
            clipsData = sharedClips || [];

            if (clipsData.length > 0) {
                const reportIds = Array.from(new Set(clipsData.map(c => c.report_id).filter(Boolean)));
                const clipIds = clipsData.map(c => c.id);

                const [reportsRes, shotsRes] = await Promise.all([
                    supabaseAdmin.from('game_reports').select('*').in('id', reportIds).order('date', { ascending: false }),
                    supabaseAdmin.from('film_shots').select('*').in('clip_id', clipIds)
                ]);

                if (reportsRes.error) throw reportsRes.error;
                if (shotsRes.error) throw shotsRes.error;

                reportsData = reportsRes.data || [];
                shotsData = shotsRes.data || [];
            }
        } else {
            // Athlete sees their own reports
            const { data: userReports, error: reportsError } = await supabaseAdmin
                .from('game_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (reportsError) throw reportsError;
            reportsData = userReports || [];

            if (reportsData.length > 0) {
                const reportIds = reportsData.map(r => r.id);
                const [clipsRes, shotsRes] = await Promise.all([
                    supabaseAdmin.from('film_clips').select('*').in('report_id', reportIds),
                    supabaseAdmin.from('film_shots').select('*').in('report_id', reportIds)
                ]);

                if (clipsRes.error) throw clipsRes.error;
                if (shotsRes.error) throw shotsRes.error;

                clipsData = clipsRes.data || [];
                shotsData = shotsRes.data || [];
            }
        }

        // Generate signed URLs for all clips in parallel using the stored DB path
        const signedUrlMap = new Map<string, string>();
        await Promise.all(
            clipsData.map(async (clip) => {
                if (clip.url) {
                    const storagePath = extractStoragePath('game-film', clip.url);
                    if (storagePath) {
                        const { data: signedData } = await supabaseAdmin.storage
                            .from('game-film')
                            .createSignedUrl(storagePath, 3600);
                        if (signedData?.signedUrl) {
                            signedUrlMap.set(clip.id, signedData.signedUrl);
                        }
                    }
                }
            })
        );

        // Assemble GameReport objects
        const assembledReports: GameReport[] = reportsData.map(report => {
            const reportClips: Clip[] = clipsData
                .filter(c => c.report_id === report.id)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    size: Number(c.size || 0),
                    url: signedUrlMap.get(c.id) || c.url || '',
                    file: null,
                    sharedWithCoach: Boolean(c.shared_with_coach)
                }));

            const reportShots: Shot[] = shotsData
                .filter(s => s.report_id === report.id)
                .map(s => ({
                    id: s.id,
                    clipId: s.clip_id,
                    timestamp: new Date(s.created_at).getTime(),
                    period: s.period,
                    shotType: s.shot_type as ShotTypeType,
                    isDeflected: s.is_deflected,
                    isScreened: s.is_screened || false,
                    isSave: s.is_save,
                    netLocation: s.net_x !== null && s.net_y !== null ? { x: Number(s.net_x), y: Number(s.net_y) } : null,
                    rinkLocation: s.rink_x !== null && s.rink_y !== null ? { x: Number(s.rink_x), y: Number(s.rink_y) } : null,
                    videoTime: s.video_time !== null ? Number(s.video_time) : undefined
                }));

            return {
                id: report.id,
                title: report.title,
                date: report.date,
                sport: report.sport as SportType,
                clips: reportClips,
                shots: reportShots
            };
        });

        return {
            success: true,
            reports: assembledReports,
            isCoachView: isCoach
        };
    } catch (err: any) {
        console.error("[fetchFilmReports] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
