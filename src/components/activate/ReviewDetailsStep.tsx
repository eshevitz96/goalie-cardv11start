import React from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Check } from 'lucide-react';

interface ReviewDetailsStepProps {
    formData: any;
    setFormData: (data: any) => void;
    userType: 'parent' | 'goalie';
    setUserType: (type: 'parent' | 'goalie') => void;
    email: string;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
}

export function ReviewDetailsStep({ formData, setFormData, userType, setUserType, email, onConfirm, isLoading }: ReviewDetailsStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Check size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Record Found</h2>
                <p className="text-muted-foreground text-sm">Please review and confirm your details.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goalie Name</label>
                        <input
                            value={formData.goalieName}
                            onChange={(e) => setFormData({ ...formData, goalieName: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goalie Email (Login)</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-muted-foreground text-sm focus:border-emerald-500 outline-none cursor-not-allowed"
                        />
                    </div>

                    {/* Guardian Email - Activates Parent Portal */}
                    <div className="col-span-2 border-t border-border pt-4 mt-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            Guardian Email <span className="text-emerald-500 text-[9px] border border-emerald-500/30 px-1 rounded">Activates Parent Portal</span>
                        </label>
                        <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => {
                                const newEmail = e.target.value;
                                setFormData({ ...formData, parentEmail: newEmail });
                                // Auto-switch role context based on presence of parent email
                                if (newEmail && newEmail.includes('@')) {
                                    setUserType('parent');
                                } else {
                                    setUserType('goalie');
                                }
                            }}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                            placeholder="Enter parent email to enable Parent Portal..."
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Leave blank if managing your own account.
                        </p>
                    </div>

                    {/* Optional Parent Name if Email provided */}
                    {formData.parentEmail.length > 3 && (
                        <div className="col-span-2 animate-in slide-in-from-top-2 fade-in">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parent Name</label>
                            <input
                                value={formData.parentName}
                                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                placeholder="Parent Name"
                            />
                        </div>
                    )}

                    <div className="col-span-2 border-t border-border pt-2 mt-2"></div>

                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Grad Year</label>
                        <input
                            value={formData.gradYear}
                            onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Birthday</label>
                        <input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Team</label>
                        <input
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                            placeholder="Current Team"
                        />
                    </div>

                </div>
            </div>

            <Button onClick={onConfirm} variant="primary" size="lg" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                {isLoading ? <Loader2 className="animate-spin" /> : "Confirm Details"}
            </Button>
        </div>
    );
}
