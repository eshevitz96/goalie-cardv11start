/**
 * useAuth hook
 * Centralizes all authentication and session logic
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { UserRole } from '@/types';

interface AuthState {
    user: { id: string; email: string; role?: UserRole; sport?: string } | null;
    userId: string | null;
    userEmail: string | null;
    userRole: UserRole | null;
    userSport: string | null;
    userRoles: UserRole[];
    localId: string | null;
    isAuthenticated: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        userId: null,
        userEmail: null,
        userRole: null,
        userSport: null,
        userRoles: [],
        localId: null,
        isAuthenticated: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // console.log("Auth Event:", event, session?.user?.email);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                loadAuth();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadAuth = async () => {
        setLoading(true);

        try {
            // Get authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            // Get local activation ID
            const localId = typeof window !== 'undefined'
                ? localStorage.getItem('activated_id')
                : null;

            // Fetch user role and sport if authenticated
            let userRole: UserRole | null = null;
            let userSport: string | null = null;
            let resolvedUser = user;

            if (resolvedUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, sport')
                    .eq('id', resolvedUser.id)
                    .single();
                userRole = (profile?.role as UserRole) || null;
                userSport = profile?.sport || null;
            }

            // Local dev bypass — only active when NEXT_PUBLIC_DEV_BYPASS=true in .env.local
            // This env var is never set in production and is gitignored
            if (!user && process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
              // Use a fake dev user — not a real UUID, not a real email
              resolvedUser = {
                id: "00000000-0000-0000-0000-000000000000",
                email: "dev@localhost"
              } as any;
              userRole = 'goalie';
              userSport = 'Lacrosse';
            }

            setAuthState({
                user: resolvedUser ? { 
                    id: resolvedUser.id, 
                    email: resolvedUser.email || '', 
                    role: userRole || undefined,
                    sport: userSport || undefined
                } : null,
                userId: resolvedUser?.id || null,
                userEmail: resolvedUser?.email || null,
                userRole,
                userSport,
                userRoles: userRole ? [userRole] : [],
                localId,
                isAuthenticated: !!resolvedUser || !!localId,
            });
        } catch (error) {
            console.error('Auth load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('activated_id');
        }
        setAuthState({
            user: null,
            userId: null,
            userEmail: null,
            userRole: null,
            userSport: null,
            userRoles: [],
            localId: null,
            isAuthenticated: false,
        });
    };

    const refresh = () => {
        loadAuth();
    };

    return {
        ...authState,
        loading,
        refresh,
        logout
    };
}
