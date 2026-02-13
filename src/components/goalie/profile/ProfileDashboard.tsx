"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, ChevronRight, HelpCircle, Edit2, Save, Loader2, Settings, Shield } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileDashboardProps {
    goalie: {
        id: string;
        name: string;
        email: string;
        team: string | null;
        catch_hand: string | null;
        height: string | null;
        weight: string | null;
        grad_year: number | null;
    };
    onSave: (data: any) => Promise<void>;
    onDeactivate: () => void;
    isSaving: boolean;
    isProcessing: boolean;
}

export function ProfileDashboard({
    goalie,
    onSave,
    onDeactivate,
    isSaving,
    isProcessing
}: ProfileDashboardProps) {
    const [showEditModal, setShowEditModal] = useState(false);

    // Local form state for the modal
    const [formData, setFormData] = useState({
        name: goalie.name || '',
        email: goalie.email || '',
        grad_year: goalie.grad_year?.toString() || '',
        team: goalie.team || '',
        height: goalie.height || '',
        weight: goalie.weight || '',
        catch_hand: goalie.catch_hand || 'Left'
    });

    const handleSaveClick = async () => {
        await onSave(formData);
        setShowEditModal(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-accent/30 transition-colors duration-300">
            <div className="max-w-md mx-auto space-y-8">
                {/* Modern Header */}
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter">CARD <span className="text-muted-foreground">SETTINGS</span></h1>
                    </div>
                </header>

                {/* Main Settings Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-3xl overflow-hidden backdrop-blur-md"
                >
                    <div
                        onClick={() => setShowEditModal(true)}
                        className="p-6 border-b border-border relative group cursor-pointer hover:bg-muted transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-muted border border-border flex items-center justify-center">
                                <User size={20} className="text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-foreground">{goalie.name}</h2>
                                <p className="text-xs text-muted-foreground">{goalie.team || 'Free Agent'} • {goalie.grad_year ? `Class of ${goalie.grad_year}` : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Edit Button (Top Right of Card) */}
                        <div className="absolute top-6 right-6 p-2 bg-secondary rounded-full text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-all">
                            <Edit2 size={16} />
                        </div>
                    </div>

                    <div className="p-2">
                        <div className="space-y-1">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors group cursor-not-allowed opacity-50">
                                <div className="flex items-center gap-3">
                                    <GoalieGuardLogo size={18} className="text-muted-foreground group-hover:text-accent transition-colors" />
                                    <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Privacy & Data</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono">SOON</Badge>
                            </button>

                            <a href="mailto:support@thegoaliebrand.com" className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors group">
                                <div className="flex items-center gap-3">
                                    <HelpCircle size={18} className="text-muted-foreground group-hover:text-accent transition-colors" />
                                    <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Support & Feedback</span>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/50" />
                            </a>
                        </div>
                    </div>

                    {/* Prominent Edit Button */}
                    <div className="p-4 border-t border-border">
                        <Button
                            onClick={() => setShowEditModal(true)}
                            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={16} /> Edit Profile
                        </Button>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-3xl overflow-hidden backdrop-blur-md p-6"
                >
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
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
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card border border-border rounded-3xl overflow-hidden backdrop-blur-md p-6"
                >
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Shield size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Security</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-bold text-foreground">Password</h3>
                            <p className="text-sm text-muted-foreground">Update your account credentials</p>
                        </div>
                        <Link href="/update-password">
                            <Button variant="outline" size="sm" className="font-bold">
                                Change
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Deactivation Zone - Subtle */}
                <div className="pt-8 text-center space-y-4">
                    <p className="text-xs text-muted-foreground/60 max-w-[280px] mx-auto leading-relaxed">
                        Need to close your card? This action is permanent and cannot be undone.
                    </p>

                    <Button
                        variant="ghost"
                        onClick={onDeactivate}
                        disabled={isProcessing}
                        className="text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-auto"
                    >
                        {isProcessing ? "Deactivating..." : "Deactivate Card"}
                    </Button>
                </div>

                <div className="fixed bottom-6 left-0 right-0 text-center">
                    <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">GoalieGuard v1.1.0</span>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all placeholder:text-muted-foreground"
                            placeholder="Full Name"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Email (Linked to Login)</label>
                        <div className="relative opacity-75">
                            <input
                                value={formData.email}
                                readOnly
                                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                            />
                            <div className="absolute right-3 top-3 text-muted-foreground">
                                <GoalieGuardLogo size={16} />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">To change your email, please contact support.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Grad Year</label>
                            <input
                                value={formData.grad_year}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setFormData({ ...formData, grad_year: val });
                                }}
                                maxLength={4}
                                pattern="\d*"
                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-muted-foreground"
                                placeholder="e.g. 2026"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Team</label>
                            <input
                                value={formData.team}
                                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all placeholder:text-muted-foreground"
                                placeholder="Current Team"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Height</label>
                            <input
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-muted-foreground"
                                placeholder="e.g. 6'2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Weight</label>
                            <input
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-muted-foreground"
                                placeholder="e.g. 185"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Catch Hand</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Left', 'Right'].map((hand) => (
                                <button
                                    key={hand}
                                    onClick={() => setFormData({ ...formData, catch_hand: hand })}
                                    className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.catch_hand === hand
                                        ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    {hand}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border">
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
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
