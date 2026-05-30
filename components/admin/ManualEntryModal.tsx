'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, X, Calendar, User, ChevronRight, CheckCircle } from 'lucide-react';
import { GoalieGuardLogo } from '@/components/ui/GoalieGuardLogo';
import { RosterItem } from '@/types';
import { supabase } from '@/utils/supabase/client';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    initialData: RosterItem | null;
    dbData: RosterItem[];
    coaches: any[];
    onSave: () => Promise<void>;
}

export function ManualEntryModal({ isOpen, onClose, editingId, initialData, dbData, coaches, onSave }: ManualEntryModalProps) {
    const [manualForm, setManualForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        guardianEmail: "",
        guardianPhone: "",
        athleteEmail: "",
        athletePhone: "",
        heightFt: "",
        heightIn: "",
        weight: "",
        catchHand: "",
        team: "",
        gradYear: "2030",
        parentName: "",
        phone: "", // Legacy
        coachId: "",
        birthday: "",
        step: 1,
        rawData: {} as any
    });

    useEffect(() => {
        if (isOpen && editingId && initialData) {
            const entry = initialData;
            const [first, ...last] = (entry.goalie_name || "").split(" ");
            setManualForm({
                firstName: first || "",
                lastName: last.join(" ") || "",
                email: entry.email,
                guardianEmail: (entry as any).guardian_email || entry.email,
                guardianPhone: (entry as any).guardian_phone || entry.parent_phone || "",
                athleteEmail: (entry as any).athlete_email || entry.raw_data?.goalie_email || "",
                athletePhone: (entry as any).athlete_phone || "",
                heightFt: entry.height ? entry.height.split("'")[0] : "",
                heightIn: entry.height ? (entry.height.split("'")[1] || "").replace('"', '') : "",
                weight: entry.weight || "",
                catchHand: entry.catch_hand || entry.catchHand || "",
                team: entry.team,
                gradYear: entry.grad_year?.toString() || "2030",
                parentName: entry.parent_name || "",
                phone: entry.parent_phone || "",
                coachId: entry.assigned_coach_id || "",
                birthday: entry.birthday || (entry as any).birth_date || "",
                step: 1,
                rawData: entry.raw_data || {}
            });
        } else {
            // Reset form
            setManualForm({
                firstName: "", lastName: "", email: "",
                guardianEmail: "", guardianPhone: "", athleteEmail: "", athletePhone: "",
                heightFt: "", heightIn: "", weight: "", catchHand: "",
                team: "", gradYear: "2030", parentName: "", phone: "", coachId: "", birthday: "", rawData: {},
                step: 1
            });
        }
    }, [isOpen, editingId, initialData]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Determine Primary Email (Guardian preferred for account management)
            const primaryEmail = manualForm.guardianEmail || manualForm.athleteEmail || manualForm.email;

            const payload = {
                email: primaryEmail, // Critical: Update primary email
                goalie_name: `${manualForm.firstName} ${manualForm.lastName}`,
                parent_name: manualForm.parentName,
                parent_phone: manualForm.guardianPhone || manualForm.phone,
                // New Fields
                guardian_email: manualForm.guardianEmail,
                guardian_phone: manualForm.guardianPhone,
                athlete_email: manualForm.athleteEmail,
                athlete_phone: manualForm.athletePhone,
                height: manualForm.heightFt && manualForm.heightIn ? `${manualForm.heightFt}'${manualForm.heightIn}"` : "",
                weight: manualForm.weight,
                catch_hand: manualForm.catchHand,

                grad_year: parseInt(manualForm.gradYear) || 2030,
                team: manualForm.team || "Unassigned",
                assigned_coach_id: manualForm.coachId === "" ? null : manualForm.coachId,
                birthday: manualForm.birthday,
                raw_data: { ...manualForm.rawData, goalie_email: manualForm.athleteEmail }
            };

            if (editingId) {
                await supabase.from('roster_uploads').update(payload).eq('id', editingId);
            } else {
                // Calculate next ID strictly based on MAX existing ID to ensure GC-8XXX standard
                const currentMaxId = dbData.reduce((max, item) => {
                    const parts = item.assigned_unique_id?.split('-') || [];
                    if (parts[0] !== 'GC') return max;
                    const num = parseInt(parts[1] || '0');
                    if (isNaN(num)) return max;
                    // Only consider IDs in the 8000+ range to stick to standard
                    return (num >= 8000 && num > max) ? num : max;
                }, 7999);

                const nextId = currentMaxId + 1;
                const uniqueId = `GC-${nextId}`;

                const { data: insertedRow, error: insertError } = await supabase
                    .from('roster_uploads')
                    .insert([{ ...payload, assigned_unique_id: uniqueId, is_claimed: true, payment_status: 'paid' }])
                    .select('id')
                    .single();

                if (insertError) throw insertError;

                // Provision Supabase Auth account so the goalie can log in immediately
                if (insertedRow?.id && primaryEmail) {
                    try {
                        const res = await fetch('/api/admin/create-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: primaryEmail,
                                rosterId: insertedRow.id,
                                goalieName: `${manualForm.firstName} ${manualForm.lastName}`,
                            }),
                        });
                        const result = await res.json();
                        if (!result.success) {
                            console.warn('User provisioning warning:', result.error);
                        }
                    } catch (provisionErr) {
                        console.warn('User provisioning failed (non-blocking):', provisionErr);
                    }
                }
            }
            await onSave();
            onClose();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl w-full max-w-lg p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-primary" /> {editingId ? 'Edit' : 'Add'} Goalie</h3>
                        <div className="flex items-center gap-2 mt-2">
                            {[1, 2, 3].map(step => (
                                <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${manualForm.step >= step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-2">Step {manualForm.step} of 3</span>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="wizard-form" onSubmit={handleManualSubmit} className="space-y-6">

                        {/* Step 1: Identity */}
                        {manualForm.step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6 bg-primary/10 p-4 rounded-xl border border-primary/20">
                                    <GoalieGuardLogo size={32} className="text-primary" />
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Goalie Identity</h4>
                                        <p className="text-xs text-muted-foreground">Establish the athlete's core profile.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">First Name</label>
                                        <input
                                            value={manualForm.firstName}
                                            onChange={e => setManualForm({ ...manualForm, firstName: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                            placeholder="e.g. Wayne"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Last Name</label>
                                        <input
                                            value={manualForm.lastName}
                                            onChange={e => setManualForm({ ...manualForm, lastName: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                            placeholder="e.g. Gretzky"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Grad Year</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={manualForm.gradYear}
                                                onChange={e => setManualForm({ ...manualForm, gradYear: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pr-16 text-sm focus:border-primary outline-none transition-colors"
                                                placeholder="2030"
                                            />
                                            {manualForm.gradYear && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {parseInt(manualForm.gradYear) > (new Date().getFullYear() + 4) ? (
                                                        <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Youth</span>
                                                    ) : (
                                                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">HS+</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Birthday</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={manualForm.birthday}
                                                onChange={e => setManualForm({ ...manualForm, birthday: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors pl-10"
                                                required
                                            />
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">
                                            {(manualForm as any).sport === 'Hockey' || !(manualForm as any).sport ? 'Catch Hand' : 'Dominant Hand'}
                                        </label>
                                        <select
                                            value={manualForm.catchHand}
                                            onChange={e => setManualForm({ ...manualForm, catchHand: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                        >
                                            <option value="">-- Select --</option>
                                            {(manualForm as any).sport === 'Hockey' || !(manualForm as any).sport ? (
                                                <>
                                                    <option value="Left">Left (Regular)</option>
                                                    <option value="Right">Right (Full Right)</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Left">Left</option>
                                                    <option value="Right">Right</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Height</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    value={manualForm.heightFt}
                                                    onChange={e => setManualForm({ ...manualForm, heightFt: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                                    placeholder="6"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">ft</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    value={manualForm.heightIn}
                                                    onChange={e => setManualForm({ ...manualForm, heightIn: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">in</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Weight</label>
                                        <input
                                            value={manualForm.weight}
                                            onChange={e => setManualForm({ ...manualForm, weight: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                            placeholder="e.g. 180 lbs"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Contact & Relations */}
                        {manualForm.step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                                {/* Athlete Contact */}
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-3">
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={14} /> Athlete Contact
                                    </h4>
                                    <div className="space-y-3">
                                        <input
                                            type="email"
                                            value={manualForm.athleteEmail}
                                            onChange={e => setManualForm({ ...manualForm, athleteEmail: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="athlete@example.com (Optional)"
                                        />
                                        <input
                                            type="tel"
                                            value={manualForm.athletePhone}
                                            onChange={e => setManualForm({ ...manualForm, athletePhone: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="Athlete Phone (Optional)"
                                        />
                                    </div>
                                </div>

                                {/* Guardian Contact */}
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3">
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                        <GoalieGuardLogo size={14} /> Guardian Info
                                    </h4>
                                    <input
                                        value={manualForm.parentName}
                                        onChange={e => setManualForm({ ...manualForm, parentName: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                                        placeholder="Guardian Name"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="email"
                                            value={manualForm.guardianEmail}
                                            onChange={e => setManualForm({ ...manualForm, guardianEmail: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="guardian@example.com"
                                        />
                                        <input
                                            type="tel"
                                            value={manualForm.guardianPhone}
                                            onChange={e => setManualForm({ ...manualForm, guardianPhone: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="Guardian Phone"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        * This email will have <strong>Parent Portal</strong> access.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Assignment */}
                        {manualForm.step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Training & Assignment</h4>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Team / Organization</label>
                                    <input
                                        value={manualForm.team}
                                        onChange={e => setManualForm({ ...manualForm, team: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                        placeholder="e.g. Junior Kings AAA"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Assigned Coach</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
                                        value={manualForm.coachId}
                                        onChange={e => setManualForm({ ...manualForm, coachId: e.target.value })}
                                    >
                                        <option value="">-- Select Primary Coach --</option>
                                        {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-6">
                                    <h5 className="font-bold text-yellow-500 text-sm mb-1">Confirm Details</h5>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        User <strong>{manualForm.firstName} {manualForm.lastName}</strong> will be added.
                                        Access will be linked to <strong>{manualForm.guardianEmail || manualForm.athleteEmail || manualForm.email}</strong>.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                    </form>
                </div>

                {/* Footer / Controls */}
                <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
                    {manualForm.step > 1 ? (
                        <button
                            onClick={() => setManualForm(prev => ({ ...prev, step: prev.step - 1 }))}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            Start Over
                        </button>
                    ) : (
                        <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-bold transition-colors">Cancel</button>
                    )}

                    {manualForm.step < 3 ? (
                        <button
                            onClick={() => {
                                // Basic validation before next
                                if (manualForm.step === 1 && (!manualForm.firstName || !manualForm.lastName || !manualForm.birthday)) {
                                    alert("Please complete all required fields.");
                                    return;
                                }
                                setManualForm(prev => ({ ...prev, step: prev.step + 1 }));
                            }}
                            className="px-6 py-2 bg-foreground text-background hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            Next Step <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="wizard-form"
                            className="px-6 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <CheckCircle size={14} /> Save to Roster
                        </button>
                    )}
                </div>

            </motion.div >
        </div >
    );
}
