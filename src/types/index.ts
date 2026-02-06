/**
 * Shared TypeScript types for GoalieCard application
 */

export type UserRole = 'parent' | 'goalie' | 'coach' | 'admin';

export interface User {
    id: string;
    email: string;
    role?: UserRole;
}

export interface Goalie {
    id: string;
    goalie_name: string;
    email?: string;
    team?: string;
    grad_year?: number;
    gradYear?: number; // Legacy support
    height?: string;
    weight?: string;
    catchHand?: string;
    catch_hand?: string; // Legacy support
    sport?: string;
    assigned_unique_id?: string;
    is_claimed?: boolean;
    session_count?: number;
    lesson_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AuthState {
    user: User | null;
    userId: string | null;
    userEmail: string | null;
    userRole: UserRole | null;
    localId: string | null;
    isAuthenticated: boolean;
}

export interface DebugInfo {
    email: string | null;
    localId: string | null;
}

export interface RosterItem {
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
    session_count: number;
    lesson_count: number;
    raw_data: Record<string, any>;
    created_at: string;
    // Extended fields for admin editing
    height?: string;
    weight?: string;
    catchHand?: string; // Legacy support
    birthday?: string;
}
