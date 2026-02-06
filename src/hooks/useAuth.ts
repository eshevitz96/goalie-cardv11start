/**
 * useAuth hook
 * Centralizes all authentication and session logic
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { AuthState, UserRole } from '@/types';

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        userId: null,
        userEmail: null,
        userRole: null,
        localId: null,
        isAuthenticated: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuth();
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

            // Fetch user role if authenticated
            let userRole: UserRole | null = null;
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                userRole = (profile?.role as UserRole) || null;
            }

            setAuthState({
                user: user ? { id: user.id, email: user.email || '', role: userRole || undefined } : null,
                userId: user?.id || null,
                userEmail: user?.email || null,
                userRole,
                localId,
                isAuthenticated: !!user || !!localId,
            });
        } catch (error) {
            console.error('Auth load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        loadAuth();
    };

    return {
        ...authState,
        loading,
        refresh,
    };
}
