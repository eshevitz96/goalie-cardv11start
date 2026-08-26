"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, Plus, Edit2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function CoachContracts() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [coachId, setCoachId] = useState<string | null>(null);

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(50);
    const [filmReviews, setFilmReviews] = useState<number>(1);
    const [includesSync, setIncludesSync] = useState(false);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCoachId(user.id);
            
            // 1. Ensure Coach Profile Exists (Foreign Key Requirement)
            const { data: existingProfile } = await supabase.from('coach_profiles').select('id').eq('id', user.id).single();
            if (!existingProfile) {
                // Upsert to satisfy foreign key for templates
                await supabase.from('coach_profiles').insert([{ id: user.id, display_name: user.email || 'Coach' }]);
            }

            // 2. Fetch Templates
            const { data } = await supabase
                .from('contract_templates')
                .select('*')
                .eq('coach_id', user.id)
                .order('price_monthly_cents', { ascending: true });
            
            if (data) setTemplates(data);
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coachId) return;

        const payload = {
            coach_id: coachId,
            name,
            description,
            price_monthly_cents: price * 100, // Convert to cents
            film_reviews_per_month: filmReviews,
            includes_sync: includesSync,
            is_active: isActive
        };

        if (editingId) {
            const { error } = await supabase.from('contract_templates').update(payload).eq('id', editingId);
            if (error) { console.error("Update Error:", error); alert("Save failed: " + error.message); return; }
        } else {
            const { error } = await supabase.from('contract_templates').insert([payload]);
            if (error) { console.error("Insert Error:", error); alert("Save failed: " + error.message); return; }
        }

        setIsEditing(false);
        setEditingId(null);
        resetForm();
        fetchTemplates();
    };

    const seedBetaTiers = async () => {
        if (!coachId) return;
        setIsLoading(true);
        const betaTiers = [
            {
                coach_id: coachId,
                name: "Standard Virtual Training",
                description: "Perfect for ongoing accountability. 1 comprehensive film review per month.",
                price_monthly_cents: 5000,
                film_reviews_per_month: 1,
                includes_sync: false,
                is_active: true
            },
            {
                coach_id: coachId,
                name: "Premium Virtual Training",
                description: "Elite level coaching. 3 film reviews per month and a 1-on-1 performance sync.",
                price_monthly_cents: 15000,
                film_reviews_per_month: 3,
                includes_sync: true,
                is_active: true
            }
        ];
        
        const { error } = await supabase.from('contract_templates').insert(betaTiers);
        if (error) {
            console.error("Seed Error:", error);
            alert("Failed to seed tiers: " + error.message);
        } else {
            fetchTemplates();
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice(50);
        setFilmReviews(1);
        setIncludesSync(false);
        setIsActive(true);
    };

    const openEdit = (t: any) => {
        setEditingId(t.id);
        setName(t.name);
        setDescription(t.description || "");
        setPrice(t.price_monthly_cents / 100);
        setFilmReviews(t.film_reviews_per_month || 0);
        setIncludesSync(t.includes_sync || false);
        setIsActive(t.is_active);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this tier?")) {
            await supabase.from('contract_templates').delete().eq('id', id);
            fetchTemplates();
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <Link href="/coach" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider mb-4">
                        <ArrowLeft size={14} /> Back to Command Center
                    </Link>
                    <h1 className="text-3xl font-black tracking-normal">CoachOS</h1>
                    <p className="text-muted-foreground text-sm mt-1">Define your virtual coaching tiers and deliverables.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => { resetForm(); setIsEditing(true); }}
                        className="flex items-center gap-2 bg-[#00E676] hover:bg-[#00C853] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        <Plus size={16} /> New Tier
                    </button>
                )}
            </header>

            {isEditing ? (
                <div className="max-w-2xl bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Tier" : "Create New Tier"}</h2>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tier Name</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g., Premium Virtual Coaching"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00E676] transition-colors"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                                <textarea 
                                    placeholder="Describe what's included..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-24 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00E676] transition-colors resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Monthly Price ($)</label>
                                <input 
                                    required
                                    type="number" 
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00E676] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Film Reviews / Mo</label>
                                <input 
                                    required
                                    type="number" 
                                    min="0"
                                    value={filmReviews}
                                    onChange={(e) => setFilmReviews(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00E676] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox"
                                    checked={includesSync}
                                    onChange={(e) => setIncludesSync(e.target.checked)}
                                    className="hidden"
                                />
                                <div className={clsx("w-5 h-5 rounded flex items-center justify-center border transition-colors", includesSync ? "bg-[#00E676] border-[#00E676]" : "bg-muted border-border group-hover:border-[#00E676]")}>
                                    {includesSync && <CheckCircle2 size={14} className="text-black" />}
                                </div>
                                <span className="text-sm font-semibold">Includes 1-on-1 Sync</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="hidden"
                                />
                                <div className={clsx("w-5 h-5 rounded flex items-center justify-center border transition-colors", isActive ? "bg-[#00E676] border-[#00E676]" : "bg-muted border-border group-hover:border-[#00E676]")}>
                                    {isActive && <CheckCircle2 size={14} className="text-black" />}
                                </div>
                                <span className="text-sm font-semibold">Publicly Active</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button 
                                type="button"
                                onClick={() => { setIsEditing(false); setEditingId(null); }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                Save Tier
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full text-center text-muted-foreground py-12 text-sm font-bold uppercase tracking-widest animate-pulse">
                            Loading Tiers...
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-full bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">📋</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Contract Tiers Yet</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mb-6">Create your first virtual coaching tier to allow athletes to subscribe to your services.</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={seedBetaTiers}
                                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border"
                                >
                                    Initialize Beta Tiers
                                </button>
                                <button 
                                    onClick={() => { resetForm(); setIsEditing(true); }}
                                    className="flex items-center gap-2 bg-[#00E676] hover:bg-[#00C853] text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                                >
                                    <Plus size={16} /> Custom Tier
                                </button>
                            </div>
                        </div>
                    ) : (
                        templates.map((t) => (
                            <div key={t.id} className={clsx("bg-card border rounded-[24px] p-6 flex flex-col transition-all relative overflow-hidden group", t.is_active ? "border-[#00E676]/30 shadow-sm" : "border-border opacity-75")}>
                                {!t.is_active && (
                                    <div className="absolute top-0 left-0 w-full bg-muted-foreground/20 text-center py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        Draft / Inactive
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{t.name}</h3>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-black text-[#00E676]">${t.price_monthly_cents / 100}</span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">/ mo</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground flex-1 mb-6">{t.description}</p>
                                
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <CheckCircle2 size={16} className="text-[#00E676]" />
                                        {t.film_reviews_per_month} Film Review{t.film_reviews_per_month !== 1 ? 's' : ''}
                                    </div>
                                    <div className={clsx("flex items-center gap-2 text-sm font-semibold", !t.includes_sync && "text-muted-foreground/50")}>
                                        {t.includes_sync ? <CheckCircle2 size={16} className="text-[#00E676]" /> : <XCircle size={16} />}
                                        1-on-1 Sync
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </main>
    );
}
