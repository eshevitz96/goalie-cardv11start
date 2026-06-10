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
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#09090B]/90 backdrop-blur-md border-t border-white/10 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-3 shadow-lg">
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
                            className="flex flex-col items-center gap-1 flex-1 py-1.5 transition-all text-center"
                        >
                            <Icon 
                                size={20} 
                                className={twMerge(
                                    "transition-colors duration-200",
                                    isActive ? "text-white" : "text-white/40 hover:text-white/70"
                                )} 
                            />
                            <span 
                                className={twMerge(
                                    "text-[9px] font-black uppercase tracking-widest transition-colors duration-200",
                                    isActive ? "text-white" : "text-white/35"
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
