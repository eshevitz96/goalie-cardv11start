"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppProvider } from '@/components/film/Store';
import MainApp from '@/components/film/MainApp';
import { Loader2 } from 'lucide-react';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';

export default function FilmPage() {
    const auth = useAuth();
    const router = useRouter();
    const [isLocalhost, setIsLocalhost] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            setIsLocalhost(true);
            return;
        }
        if (!auth.loading && !auth.isAuthenticated) {
            router.push('/login');
        }
    }, [auth.loading, auth.isAuthenticated, router]);

    if (!isLocalhost && (auth.loading || !auth.isAuthenticated)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    return (
        <AppProvider>
            <div className="film-workspace-root pb-[calc(100px+env(safe-area-inset-bottom))] md:pb-0 min-h-screen relative">
                <MainApp />
                <MobileBottomNav />
            </div>
        </AppProvider>
    );
}
