"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("Supabase Admin Configuration Missing");
    }
    return createClient(url, key);
}

async function verifyAdminSession(): Promise<{ isAdmin: boolean; adminUserId: string | null }> {
    try {
        const serverSupabase = await createServerSupabase();
        const { data: { user } } = await serverSupabase.auth.getUser();

        if (!user) {
            return { isAdmin: false, adminUserId: null };
        }

        const adminClient = getSupabaseAdmin();
        const [{ data: prof }, { data: usr }] = await Promise.all([
            adminClient.from('profiles').select('role, roles').eq('id', user.id).maybeSingle(),
            adminClient.from('users').select('role').eq('auth_user_id', user.id).maybeSingle()
        ]);

        const rolesArr = Array.isArray(prof?.roles) ? prof?.roles : [];
        const isAdmin = prof?.role === 'admin' || usr?.role === 'admin' || rolesArr.includes('admin') || user.email === 'eshevitz96@gmail.com';

        return {
            isAdmin: Boolean(isAdmin),
            adminUserId: user.id
        };
    } catch {
        return { isAdmin: false, adminUserId: null };
    }
}

export interface ManagedUser {
    id: string;
    email: string;
    fullName: string;
    goalieName: string;
    role: string;
    roles: string[];
    createdAt: string;
    assignedGoaliesCount?: number;
}

/**
 * Admin action: fetch all users and their roles for management
 */
export async function getUsersForRoleManagement(): Promise<{ success: boolean; users?: ManagedUser[]; error?: string }> {
    const { isAdmin } = await verifyAdminSession();
    if (!isAdmin) {
        return { success: false, error: "Unauthorized: Admin access required." };
    }

    try {
        const adminClient = getSupabaseAdmin();
        const [
            { data: profiles },
            { data: usersRows },
            { data: rosters }
        ] = await Promise.all([
            adminClient.from('profiles').select('id, email, full_name, goalie_name, role, roles, created_at').order('created_at', { ascending: false }),
            adminClient.from('users').select('id, auth_user_id, email, display_name, first_name, last_name, role'),
            adminClient.from('roster_uploads').select('id, assigned_coach_id')
        ]);

        const rosterList = rosters || [];
        const usersList = usersRows || [];

        const merged: ManagedUser[] = (profiles || []).map(p => {
            const uRow = usersList.find(u => u.auth_user_id === p.id || (p.email && u.email?.toLowerCase() === p.email.toLowerCase()));
            const displayName = p.full_name || 
                               (uRow?.display_name) || 
                               (uRow?.first_name ? `${uRow.first_name} ${uRow.last_name || ''}`.trim() : '') || 
                               p.goalie_name || 
                               (p.email ? p.email.split('@')[0] : 'User');

            const assignedCount = rosterList.filter(r => r.assigned_coach_id === p.id).length;

            return {
                id: p.id,
                email: p.email || uRow?.email || '',
                fullName: displayName,
                goalieName: p.goalie_name || '',
                role: p.role || uRow?.role || 'goalie',
                roles: Array.isArray(p.roles) ? p.roles : [p.role || 'goalie'],
                createdAt: p.created_at || '',
                assignedGoaliesCount: assignedCount
            };
        });

        return { success: true, users: merged };
    } catch (err: any) {
        console.error("[getUsersForRoleManagement] Error:", err);
        return { success: false, error: err?.message || "Failed to load users." };
    }
}

/**
 * Admin action: grant or revoke coach role, or change user role
 */
export async function updateUserRole(payload: {
    targetUserId: string;
    newRole: 'coach' | 'goalie' | 'parent' | 'admin';
}): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdminSession();
    if (!isAdmin) {
        return { success: false, error: "Unauthorized: Admin access required." };
    }

    try {
        const { targetUserId, newRole } = payload;
        if (!targetUserId || !newRole) {
            return { success: false, error: "Missing required parameters." };
        }

        const adminClient = getSupabaseAdmin();

        // 1. Fetch existing profile to update roles array
        const { data: existingProf } = await adminClient
            .from('profiles')
            .select('role, roles')
            .eq('id', targetUserId)
            .maybeSingle();

        const currentRoles: string[] = Array.isArray(existingProf?.roles) ? existingProf.roles : [];
        let updatedRoles = currentRoles.filter(r => r !== newRole && r !== 'coach' && r !== 'goalie' && r !== 'parent' && r !== 'admin');
        updatedRoles.push(newRole);

        // Update profile
        const { error: profError } = await adminClient
            .from('profiles')
            .update({
                role: newRole,
                roles: updatedRoles
            })
            .eq('id', targetUserId);

        if (profError) {
            console.error("[updateUserRole] Profile update error:", profError);
            return { success: false, error: profError.message };
        }

        // Update users table row if linked
        await adminClient
            .from('users')
            .update({ role: newRole })
            .eq('auth_user_id', targetUserId);

        return { success: true };
    } catch (err: any) {
        console.error("[updateUserRole] Error:", err);
        return { success: false, error: err?.message || "Failed to update user role." };
    }
}
