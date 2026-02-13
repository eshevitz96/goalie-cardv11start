"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotificationBannerProps {
    notification: {
        id: string;
        title: string;
        message: string;
        type?: string;
    } | null;
    onDismiss: () => void;
}

export function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
    if (!notification || notification.type !== 'alert') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 mb-6 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 backdrop-blur-sm"
        >
            <div className="p-2 bg-red-500/20 rounded-full text-red-500">
                <Bell size={16} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground p-1 h-auto w-auto hover:bg-transparent"
            >
                <span className="sr-only">Dismiss</span>&times;
            </Button>
        </motion.div>
    );
}
