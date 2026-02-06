"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { supabase } from "@/utils/supabase/client";
import { updateCoachProfile } from "./actions";
import { useRouter } from "next/navigation";

export default function CoachProfile() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Form States
    const [fullName, setFullName] = useState("");
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [syncEnabled, setSyncEnabled] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            if (data) {
                setProfile(data);
                // Fallback logic for name: full_name -> goalie_name -> email
                setFullName(data.full_name || data.goalie_name || user.email?.split('@')[0] || "");
                setTitle(data.title || "");
                setBio(data.bio || "");
                setSyncEnabled(data.settings?.calendar_sync || false);
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, [router]);

    const handleSave = () => {
        setMessage(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("title", title);
            formData.append("bio", bio);
            if (syncEnabled) formData.append("calendarSync", "on");

            const result = await updateCoachProfile(formData);

            if (result.error) {
                setMessage({ text: result.error, type: "error" });
            } else {
                setMessage({ text: "Profile updated successfully!", type: "success" });
                // Optional: Refresh router to ensure server components verify updates if needed
                router.refresh();
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/coach"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        EDIT <span className="text-primary">PROFILE</span>
                    </h1>
                </div>

                {/* Profile Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8">

                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                            <span className="text-3xl font-black text-zinc-600">
                                {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div className="space-y-4 w-full">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Coach Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Head Goalie Coach"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resume / Bio */}
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Coaching Resume / Bio</label>
                        <textarea
                            rows={6}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about your experience..."
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700 resize-none"
                        />
                    </div>

                    {/* Sync Settings */}
                    <div className="border-t border-zinc-800 pt-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Cloud className="text-blue-500" size={20} />
                            Sync Settings
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                            <div>
                                <div className="font-bold text-sm text-zinc-200">iCloud Calendar Sync</div>
                                <div className="text-xs text-zinc-500">Automatically add sessions to your calendar</div>
                            </div>
                            <div
                                onClick={() => setSyncEnabled(!syncEnabled)}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${syncEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${syncEnabled ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`p-3 rounded-xl text-center text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Link href="/coach" className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-zinc-400 hover:text-white transition-all text-center">
                            Cancel
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={isPending}
                            className="flex-1 py-4 bg-gradient-to-r from-primary to-rose-600 rounded-xl font-bold text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 h-auto"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>

                </div>
            </div>
        </main>
    );
}
