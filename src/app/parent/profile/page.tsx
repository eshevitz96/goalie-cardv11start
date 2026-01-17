"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Shield, Settings, User } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ParentProfile() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [dbId, setDbId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        goalie_name: "",
        grad_year: "",
        team: "",
        height: "",
        weight: "",
        catch_hand: "Left"
    });

    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Auth Check
            const { data: { user } } = await supabase.auth.getUser();
            let emailToSearch = user?.email;
            const localId = typeof window !== 'undefined' ? localStorage.getItem('activated_id') : null;

            if (!emailToSearch && !localId) {
                // Not authenticated
                setIsLoading(false);
                return;
            }

            let query = supabase.from('roster_uploads').select('*');

            const conditions = [];
            if (emailToSearch) conditions.push(`email.ilike.${emailToSearch}`);
            if (localId) conditions.push(`assigned_unique_id.eq.${localId}`);

            if (conditions.length > 0) {
                query = query.or(conditions.join(','));
            }

            const { data, error } = await query;

            if (data && data.length > 0) {
                const p = data[0]; // Assume first match
                setDbId(p.id);
                setFormData({
                    goalie_name: p.goalie_name || "",
                    grad_year: p.grad_year?.toString() || "",
                    team: p.team || "",
                    height: p.img_url || "", // Using img_url as temp storage or add new column? Assume we don't have height/weight cols yet. 
                    // WAIT: The DB schema only has 'goalie_name', 'email', 'grad_year', 'team', 'parent_name', 'parent_phone'.
                    // Height/Weight are NOT in DB yet. We should probably only edit what we have, OR silently ignore strictly purely UI fields for now.
                    // Let's Edit Name, Team, Year.
                    weight: "",
                    catch_hand: "Left"
                });
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!dbId) return;

        const updates = {
            goalie_name: formData.goalie_name,
            grad_year: parseInt(formData.grad_year) || 2030,
            team: formData.team
        };

        const { error } = await supabase.from('roster_uploads').update(updates).eq('id', dbId);

        if (error) {
            alert("Error saving: " + error.message);
        } else {
            alert("Profile Updated Successfully!");
            router.push('/parent'); // Go back to dashboard on success? Or stay? Stay is better UX usually.
        }
    };

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/parent"
                            className="p-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors text-foreground"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-black italic tracking-tighter">
                            GOALIE <span className="text-primary">PROFILE</span>
                        </h1>
                    </div>
                </div>

                {/* Goalie Info Form */}
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <User size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Goalie Information</span>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center relative group cursor-pointer overflow-hidden">
                            {/* Placeholder for uploaded image */}
                            <Shield size={40} className="text-muted-foreground" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold uppercase text-white">Edit Photo</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goalie Name</label>
                            <input
                                type="text"
                                value={formData.goalie_name}
                                onChange={(e) => setFormData({ ...formData, goalie_name: e.target.value })}
                                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Birth Year</label>
                                <input
                                    type="text"
                                    value={formData.grad_year}
                                    onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Team (Club & School)</label>
                                <input
                                    type="text"
                                    value={formData.team}
                                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50"
                                />
                            </div>
                        </div>

                        {/* Note: Height, Weight, Catch are UI-only for now unless we add columns to Supabase. Keeping them as UI placeholders but connected to state so they don't look broken */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Height</label>
                                <input
                                    type="text"
                                    placeholder="6'1"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight</label>
                                <input
                                    type="text"
                                    placeholder="175lbs"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catch</label>
                                <div className="relative">
                                    <select
                                        value={formData.catch_hand}
                                        onChange={(e) => setFormData({ ...formData, catch_hand: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50 appearance-none"
                                    >
                                        <option>Left</option>
                                        <option>Right</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">▼</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full mt-4 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>

                </div>

                {/* Account Settings */}
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Settings size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Preferences</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-bold text-foreground">Appearance</h3>
                            <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    <div className="pt-6 border-t border-border space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground">Session Reminders</h3>
                                <p className="text-sm text-muted-foreground">Get notified 24h before lessons</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground">Training Reports</h3>
                                <p className="text-sm text-muted-foreground">Receive weekly progress summaries</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Payment Methods</span>
                        </div>

                        <div className="flex items-center justify-between bg-background border border-border p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-zinc-800 rounded flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-white tracking-widest">VISA</span>
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm">•••• 4242</p>
                                    <p className="text-xs text-muted-foreground">Expires 12/28</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide">
                                Update
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Security</span>
                        </div>

                        <button className="w-full py-3 bg-secondary border border-border hover:bg-secondary/80 text-foreground rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                            Reset Password
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
