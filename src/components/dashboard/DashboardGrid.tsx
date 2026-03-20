"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardWidget, WidgetSize } from "./DashboardWidget";
import { Button } from "@/components/ui/Button"; // Or your standard button
import { Settings, Plus, LayoutGrid, Wallpaper } from "lucide-react";
import { WallpaperPicker } from "./WallpaperPicker";

// Define the shape of a widget item in our grid
export interface WidgetItem {
    id: string;
    type: string; // 'coaches_corner', 'events', 'stats', etc.
    size: WidgetSize;
    title?: string;
    data?: any; // Props to pass to the specific widget component
}

interface DashboardGridProps {
    widgets: WidgetItem[];
    onLayoutChange?: (newWidgets: WidgetItem[]) => void;
    renderWidget: (item: WidgetItem) => React.ReactNode; // Callback to render specific content
    availableWidgets?: WidgetItem[]; // Optional prop to override default available widgets
    storageKey?: string; // Key for local storage
}

export function DashboardGrid({ widgets: initialWidgets, onLayoutChange, renderWidget, availableWidgets: propAvailableWidgets }: DashboardGridProps) {
    const [widgets, setWidgets] = useState<WidgetItem[]>(initialWidgets);
    const [isEditing, setIsEditing] = useState(false);
    const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
    const [wallpaper, setWallpaper] = useState<string>("bg-gradient-to-br from-gray-900 to-black");
    const [mounted, setMounted] = useState(false);

    // Default widgets if none provided (Backwards compatibility for Goalie Portal)
    const defaultAvailableWidgets: WidgetItem[] = [
        { id: 'profile', type: 'profile', size: 'md', title: 'Goalie Card' },
        { id: 'coach', type: 'coaches_corner', size: 'sm', title: 'Coaches Corner' },
        { id: 'events', type: 'events', size: 'md', title: 'Schedule & History' },
        { id: 'ai_coach', type: 'ai_coach', size: 'xl', title: 'Coach OS' },
        { id: 'stats', type: 'stats', size: 'sm', title: 'Stats' },
        { id: 'notifications', type: 'notifications', size: 'md', title: 'Notifications' },
    ];

    const availableWidgets = propAvailableWidgets || defaultAvailableWidgets;

    const handleAddWidget = (widgetExample: WidgetItem) => {
        // Check if already exists
        if (widgets.find(w => w.id === widgetExample.id)) {
            alert("Widget already added!");
            return;
        }
        const updated = [...widgets, widgetExample];
        saveLayout(updated);
        setIsEditing(false); // Close edit mode after adding? Optional.
    };

    const getAvailableWidgets = () => {
        return availableWidgets.filter(aw => !widgets.find(w => w.id === aw.id));
    };

    const saveLayout = (updatedWidgets: WidgetItem[]) => {
        setWidgets(updatedWidgets);
        onLayoutChange?.(updatedWidgets);
        // localStorage logic could go here if storageKey provided
    };

    const handleResize = (id: string, size: WidgetSize) => {
        const updated = widgets.map(w => w.id === id ? { ...w, size } : w);
        saveLayout(updated);
    };

    const handleRemove = (id: string) => {
        const updated = widgets.filter(w => w.id !== id);
        saveLayout(updated);
    };

    const handleWallpaperChange = (newWallpaper: string) => {
        setWallpaper(newWallpaper);
        setShowWallpaperPicker(false);
    };

    if (!mounted) return null; // Prevent hydration mismatch on initial render

    return (
        <div className={`min-h-screen p-4 md:p-8 transition-colors duration-700 bg-cover bg-center bg-fixed ${wallpaper.startsWith('http') || wallpaper.startsWith('/') ? '' : wallpaper}`}
            style={wallpaper.startsWith('http') || wallpaper.startsWith('/') ? { backgroundImage: `url(${wallpaper})` } : {}}
        >
            {/* Toolbar */}
            <div className="flex justify-end gap-2 mb-6 fixed bottom-4 right-4 z-[100] md:sticky md:bottom-auto md:top-4 md:right-0">
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex gap-2"
                        >
                            <Button
                                variant="secondary"
                                onClick={() => setShowWallpaperPicker(true)}
                                className="shadow-xl backdrop-blur-md bg-black/50 text-white border border-white/20"
                                data-testid="dashboard-background-btn"
                            >
                                <Wallpaper size={16} className="mr-2" /> Background
                            </Button>

                            {/* Add Widget Dropdown */}
                            <div className="relative group">
                                <Button
                                    variant="secondary"
                                    className="shadow-xl backdrop-blur-md bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                                >
                                    <Plus size={16} className="mr-2" /> Add Widget
                                </Button>
                                <div className="absolute right-0 bottom-full mb-2 w-56 bg-black/90 border border-white/10 rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <div className="text-xs font-bold text-muted-foreground px-2 py-1 mb-1">AVAILABLE WIDGETS</div>
                                    {getAvailableWidgets().length === 0 ? (
                                        <div className="text-sm text-center py-2 text-muted-foreground">All widgets added</div>
                                    ) : (
                                        getAvailableWidgets().map(w => (
                                            <button
                                                key={w.id}
                                                onClick={() => handleAddWidget(w)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                                            >
                                                {w.title}
                                                <Plus size={14} className="text-muted-foreground" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? 'primary' : 'ghost'}
                    className={`shadow-xl backdrop-blur-md transition-all ${isEditing ? 'bg-primary text-white' : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'}`}
                    data-testid="dashboard-settings-btn"
                >
                    {isEditing ? 'Done' : <Settings size={20} />}
                </Button>
            </div>

            {/* Grid Area */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto pb-20 md:pb-0"
            >
                <AnimatePresence>
                    {widgets.map((widget) => (
                        <DashboardWidget
                            key={widget.id}
                            id={widget.id}
                            title={widget.title}
                            size={widget.size}
                            isEditing={isEditing}
                            onResize={(s) => handleResize(widget.id, s)}
                            onRemove={() => handleRemove(widget.id)}
                            className={isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
                        >
                            {renderWidget(widget)}
                        </DashboardWidget>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Modals */}
            <WallpaperPicker
                isOpen={showWallpaperPicker}
                onClose={() => setShowWallpaperPicker(false)}
                onSelect={handleWallpaperChange}
                current={wallpaper}
            />
        </div>
    );
}
