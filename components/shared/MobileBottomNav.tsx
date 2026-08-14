"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Video, Target } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function MobileBottomNav() {
    const pathname = usePathname() || "";

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Calendar",
            href: "/calendar",
            icon: Calendar,
        },
        {
            name: "Film",
            href: "/film",
            icon: Video,
        },
        {
            name: "Training",
            href: "/training",
            icon: Target,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#09090B] border-t border-zinc-900 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-6 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
            <div className="max-w-md mx-auto flex items-center justify-between">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Check if current pathname starts with item.href (but handle root/dashboard precisely)
                    const isActive = item.href === "/dashboard" 
                        ? pathname === "/dashboard" 
                        : pathname.startsWith(item.href);

                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all active:scale-[0.93] text-center"
                        >
                            <Icon 
                                size={22} 
                                className={twMerge(
                                    "transition-colors duration-150",
                                    isActive ? "text-white" : "text-[#71717A] hover:text-zinc-400"
                                )} 
                            />
                            <span 
                                className={twMerge(
                                    "text-[9px] font-bold uppercase tracking-wider mt-1 transition-colors duration-150",
                                    isActive ? "text-white" : "text-[#71717A]"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
