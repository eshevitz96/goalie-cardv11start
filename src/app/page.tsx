"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { supabase } from "@/utils/supabase/client";
import { BrandLogo } from "@/components/ui/BrandLogo";

import { LandingHero } from "@/components/LandingHero";

export default function EntryPortal() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace("/dashboard");
            } else {
                setIsLoading(false);
            }
        };
        checkSession();
    }, [router]);

    if (isLoading) return null;

    return <LandingHero />;
}
