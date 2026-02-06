"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Shield, Settings, User, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

export default function ParentProfile() {
    const router = useRouter();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [dbId, setDbId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<{
        goalie_name: string;
        email: string;
        grad_year: string;
        level: string;
        team: string; // Legacy/Primary team
        teams: { name: string, type: 'Club' | 'School' | 'Pro', years: string }[];
        height: string;
        weight: string;
        catch_hand: string;
    }>({
        goalie_name: "",
        email: "",
        grad_year: "",
        level: "Youth",
        team: "",
        teams: [{ name: "", type: "Club", years: "" }],
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
                // Prioritize the record that matches the ID if possible, else just the first one
                const p = localId ? data.find(d => d.assigned_unique_id === localId) || data[0] : data[0];
                setDbId(p.id);

                // Parse Teams
                let loadedTeams: { name: string, type: 'Club' | 'School' | 'Pro', years: string }[] = [{ name: p.team || "", type: "Club", years: "" }];
                if (p.raw_data && p.raw_data.teams && Array.isArray(p.raw_data.teams)) {
                    loadedTeams = p.raw_data.teams.map((t: any) => ({
                        name: t.name || "",
                        type: t.type || "Club",
                        years: t.years || ""
                    }));
                }

                // Parse Level
                let loadedLevel = p.raw_data?.level || "Youth";
                if (localId && (localId.includes('PRO') || localId === 'GC-8001')) loadedLevel = 'Pro';

                setFormData({
                    goalie_name: p.goalie_name || "",
                    email: p.email || "",
                    grad_year: p.grad_year?.toString() || "",
                    level: loadedLevel,
                    team: p.team || "",
                    teams: loadedTeams,
                    height: p.height || "",
                    weight: p.weight || "",
                    catch_hand: p.catch_hand || "Left"
                });
            } else if (emailToSearch === 'thegoaliebrand@gmail.com' || localId === 'GC-PRO-HKY') {
                // Fallback for Demo User
                setFormData({
                    goalie_name: "Elliott Shevitz",
                    email: "thegoaliebrand@gmail.com",
                    grad_year: "2018",
                    level: "Pro",
                    team: "Arizona Coyotes",
                    teams: [{ name: "Arizona Coyotes", type: "Pro", years: "2023-Present" }],
                    height: "6'2",
                    weight: "205",
                    catch_hand: "Left"
                });
            }

            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!dbId) {
            toast.warning("No record found to update.");
            return;
        }
        setIsSaving(true);

        try {
            // 1. Fetch current raw_data to preserve other keys
            const { data: currentData, error: fetchError } = await supabase
                .from('roster_uploads')
                .select('raw_data')
                .eq('id', dbId)
                .single();

            if (fetchError) throw fetchError;

            const existingRaw = currentData?.raw_data || {};

            // 2. Prepare Updates
            const updatedRaw = {
                ...existingRaw,
                teams: formData.teams,
                level: formData.level
            };

            const updates = {
                goalie_name: formData.goalie_name,
                email: formData.email,
                grad_year: parseInt(formData.grad_year) || null,
                height: formData.height,
                weight: formData.weight,
                catch_hand: formData.catch_hand,
                // Sync legacy 'team' field with the first team in the list
                team: formData.teams.length > 0 ? formData.teams[0].name : formData.team,
                raw_data: updatedRaw
            };

            // 3. Update Database
            const { error: updateError } = await supabase
                .from('roster_uploads')
                .update(updates)
                .eq('id', dbId);

            if (updateError) throw updateError;

            toast.success("Profile Updated Successfully!");

            // Optional: Soft Reload to refresh context if needed, or just let state persist
            router.refresh();

        } catch (err: any) {
            console.error("Save Error:", err);
            toast.error("Error saving profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

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
                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 h-10 w-10"
                    >
                        {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    </Button>
                </div>


                {/* FORM */}
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="grid gap-4">
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

                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                                />
                                <p className="text-[10px] text-muted-foreground">Changing this will update where you receive notifications.</p>
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
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Level</label>
                                    <div className="relative">
                                        <select
                                            value={formData.level || 'Youth'}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:border-muted-foreground/50 appearance-none"
                                        >
                                            <option value="Youth">Youth (Club)</option>
                                            <option value="High School">High School</option>
                                            <option value="College">College</option>
                                            <option value="Pro">Professional</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">▼</div>
                                    </div>
                                </div>
                            </div>

                            {/* TEAMS SECTION */}
                            <div className="grid gap-3 p-4 bg-secondary/30 rounded-xl border border-border/50">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                                    <span>Teams {formData.level === 'Pro' ? '(Must include Years)' : '(Max 5)'}</span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{formData.teams.length}/5</span>
                                </label>

                                {formData.teams.map((team, idx) => (
                                    <div key={idx} className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                                        <input
                                            type="text"
                                            placeholder="Team Name"
                                            value={team.name}
                                            onChange={(e) => {
                                                const newTeams = [...formData.teams];
                                                newTeams[idx].name = e.target.value;
                                                setFormData({ ...formData, teams: newTeams });
                                            }}
                                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-w-[120px]"
                                        />
                                        <select
                                            value={team.type}
                                            onChange={(e) => {
                                                const newTeams = [...formData.teams];
                                                newTeams[idx].type = e.target.value as any;
                                                setFormData({ ...formData, teams: newTeams });
                                            }}
                                            className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:border-primary w-24"
                                        >
                                            <option value="Club">Club</option>
                                            <option value="School">School</option>
                                            <option value="Pro">Pro</option>
                                        </select>

                                        <input
                                            type="text"
                                            placeholder={formData.level === 'Pro' ? "Years (e.g. 2023-24)" : "Years (Optional)"}
                                            value={team.years || ""}
                                            onChange={(e) => {
                                                const newTeams = [...formData.teams];
                                                newTeams[idx].years = e.target.value;
                                                setFormData({ ...formData, teams: newTeams });
                                            }}
                                            className={`bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary w-32 ${formData.level === 'Pro' && (!team.years) ? 'border-red-500/50' : 'border-border'}`}
                                        />

                                        {formData.teams.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const newTeams = formData.teams.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, teams: newTeams });
                                                }}
                                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors h-auto"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {formData.teams.length < 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, teams: [...formData.teams, { name: "", type: "Club", years: "" }] })}
                                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-1 h-auto p-0 hover:bg-transparent"
                                    >
                                        + Add Another Team
                                    </Button>
                                )}
                            </div>

                            {/* Stats Removed by Request */}
                        </div>
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
                    </div>
                </div>
            </div>
        </main>
    );
}
