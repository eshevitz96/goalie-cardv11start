"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export function useSubscription() {
    const [isPro, setIsPro] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('free');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkSub() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('is_pro, subscription_status')
                .eq('id', user.id)
                .single();

            if (data) {
                setIsPro(data.is_pro || false);
                setStatus(data.subscription_status || 'free');
            }
            setIsLoading(false);
        }

        checkSub();
    }, []);

    const handleUpgrade = async (priceId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            body: JSON.stringify({
                priceId,
                userId: user.id,
                email: user.email,
                mode: 'subscription',
                returnUrl: window.location.origin + window.location.pathname
            })
        });

        const { url } = await res.json();
        if (url) window.location.href = url;
    };

    return { isPro, status, isLoading, handleUpgrade };
}
