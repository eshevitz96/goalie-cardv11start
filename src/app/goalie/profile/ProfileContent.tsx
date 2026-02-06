"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Shield, ChevronRight, HelpCircle, Edit2, X, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ProfileContentProps {
    goalie: {
        id: string;
        name: string;
        email: string;
        team: string | null;
        catch_hand: string | null;
        height: string | null;
        weight: string | null;
        grad_year: number | null;
    }
}

export default function ProfileContent({ goalie }: ProfileContentProps) {
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Edit State
    const [formData, setFormData] = useState({
        team: goalie.team || '',
        height: goalie.height || '',
        weight: goalie.weight || '',
        catch_hand: goalie.catch_hand || 'Left'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleDeactivate = async () => {
        // TODO: Implement deleteAccount server action
        toast.warning("Account deactivation is currently disabled. Please contact support@thegoaliebrand.com to deactivate your card.");
        return;

        /* Original code - needs server action implementation
        if (!confirm("Are you sure you want to deactivate your card?\n\nThis will remove your roster spot and training history.")) return;

        const confirmText = prompt("To confirm, type 'DEACTIVATE' below:");
        if (confirmText === 'DEACTIVATE') {
            setIsProcessing(true);
            try {
                await deleteAccount();
            } catch (err: any) {
                toast.error("Deactivation Failed: " + err.message);
                setIsProcessing(false);
            }
        }
        */
    };

    const handleSave = async () => {
        setIsSaving(true);
        // supabase is imported from @/utils/supabase/client

        const { error } = await supabase
            .from('roster_uploads')
            .update({
                team: formData.team,
                height: formData.height,
                weight: formData.weight,
                catch_hand: formData.catch_hand
            })
            .eq('id', goalie.id);

        if (error) {
            toast.error("Failed to save changes.");
        } else {
            setShowEditModal(false);
            // Optional: Router refresh to show new data, but state handles it locally for now if we synced it.
            // For now, simple reload or we can just hope revalidation happens. 
            // Ideally trigger a server revalidation.
            window.location.reload();
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans selection:bg-emerald-500/30">
            <div className="max-w-md mx-auto space-y-8">
                {/* Modern Header */}
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/goalie" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter">CARD <span className="text-zinc-500">SETTINGS</span></h1>
                    </div>
                </header>

                {/* Main Settings Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md"
                >
                    <div
                        onClick={() => setShowEditModal(true)}
                        className="p-6 border-b border-white/5 relative group cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center">
                                <User size={20} className="text-zinc-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">{goalie.name}</h2>
                                <p className="text-xs text-zinc-500">{goalie.team || 'Free Agent'} • {goalie.grad_year ? `Class of ${goalie.grad_year}` : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Edit Button (Top Right of Card) */}
                        <div className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                            <Edit2 size={16} />
                        </div>
                    </div>

                    <div className="p-2">
                        <div className="space-y-1">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group cursor-not-allowed opacity-50">
                                <div className="flex items-center gap-3">
                                    <Shield size={18} className="text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Privacy & Data</span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono border border-zinc-800 px-1.5 py-0.5 rounded">SOON</span>
                            </button>

                            <a href="mailto:support@thegoaliebrand.com" className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <HelpCircle size={18} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Support & Feedback</span>
                                </div>
                                <ChevronRight size={16} className="text-zinc-700" />
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Deactivation Zone - Subtle */}
                <div className="pt-8 text-center space-y-4">
                    <p className="text-xs text-zinc-600 max-w-[280px] mx-auto leading-relaxed">
                        Need to close your card? This action is permanent and cannot be undone.
                    </p>

                    <Button
                        variant="ghost"
                        onClick={handleDeactivate}
                        disabled={isProcessing}
                        className="text-xs font-bold text-zinc-700 hover:text-red-500 hover:bg-red-500/10 h-auto"
                    >
                        {isProcessing ? "Deactivating..." : "Deactivate Card"}
                    </Button>
                </div>

                <div className="fixed bottom-6 left-0 right-0 text-center">
                    <span className="text-[10px] font-mono text-zinc-800 uppercase tracking-widest">GoalieGuard v1.1.0</span>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Team</label>
                        <input
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                            className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                            placeholder="Current Team"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Height</label>
                            <input
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                                placeholder="e.g. 6'2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Weight</label>
                            <input
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                                placeholder="e.g. 185"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Catch Hand</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Left', 'Right'].map((hand) => (
                                <button
                                    key={hand}
                                    onClick={() => setFormData({ ...formData, catch_hand: hand })}
                                    className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.catch_hand === hand
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                                        }`}
                                >
                                    {hand}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <>Save Changes <Save size={18} /></>}
                    </button>
                </div>
            </Modal>
            <AnimatePresence>
            </AnimatePresence>
        </div>
    );
}
