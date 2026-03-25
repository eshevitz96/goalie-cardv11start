"use client";

import { useState, useEffect } from "react";
import { 
    Loader2, 
    ArrowUpDown, 
    Search, 
    Filter, 
    MoreHorizontal, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Zap,
    ExternalLink,
    Edit3,
    User,
    Mail
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";

type Submission = {
    id: string;
    athlete_name: string;
    parent_name?: string;
    email: string;
    phone: string;
    access_code: string;
    status: string;
    payment_status: string;
    waiver_completed: boolean;
    is_test_mode: boolean;
    created_at: string;
    stripe_session_id?: string;
};

export function PrivateAccessSubmissions() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchSubmissions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('private_training_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSubmissions(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const filteredSubmissions = submissions.filter(s => {
        const matchesSearch = 
            s.athlete_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'complete': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'ready for payment': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'waiver pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'invited': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6 mb-8">
                <div>
                   <h2 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-3">
                        Private Training Access <Zap size={18} className="text-primary fill-primary" />
                   </h2>
                   <p className="text-muted-foreground text-sm font-medium">Internal Enrollment Status Tracking</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                        <input 
                            type="text"
                            placeholder="Search names/emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-secondary/40 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/40 w-full min-w-[240px]"
                        />
                    </div>
                    
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 font-bold uppercase tracking-widest text-[9px] h-[38px]"
                    >
                        <option value="all">Status: All</option>
                        <option value="invited">Invited</option>
                        <option value="waiver pending">Waiver Pending</option>
                        <option value="ready for payment">Ready for Payment</option>
                        <option value="paid">Paid</option>
                        <option value="complete">Complete</option>
                    </select>
                    
                    <Button 
                        onClick={fetchSubmissions} 
                        variant="secondary" 
                        size="md"
                        className="h-[38px] px-3"
                    >
                        <ArrowUpDown size={14} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-[10px] uppercase font-black tracking-widest">Syncing Records...</p>
                </div>
            ) : filteredSubmissions.length === 0 ? (
                <div className="bg-secondary/20 border border-border/30 rounded-3xl p-20 text-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/40">
                        <Search size={24} className="text-muted-foreground opacity-30" />
                    </div>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-40">No entries found for this filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSubmissions.map((s) => (
                        <div key={s.id} className="group bg-card/20 backdrop-blur-xl border border-border/40 rounded-2xl p-6 hover:border-primary/20 transition-all shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner group-hover:scale-105 transition-transform">
                                        <User size={20} className="opacity-80" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black tracking-tight text-lg leading-none">{s.athlete_name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                           <span className="flex items-center gap-1"><Mail size={10} /> {s.email}</span>
                                           <span className="opacity-30">•</span>
                                           <span className="flex items-center gap-1 font-mono tracking-tighter opacity-80 uppercase">{s.access_code}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="space-y-1">
                                         <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-1">Status</p>
                                         <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(s.status)}`}>
                                            {s.status}
                                         </div>
                                    </div>

                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-1">Payment</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            {s.is_test_mode && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 border border-amber-500/20 px-1.5 py-0.5 rounded-md">Test</span>
                                            )}
                                            <span className={`text-[11px] font-bold ${s.payment_status === 'paid' ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>
                                                {s.payment_status === 'paid' ? '$1,600.00 Paid' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-0.5 border-l border-border/40 pl-6 ml-2">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                                            <Edit3 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-border/30 flex items-center justify-between text-[10px] font-bold tracking-widest opacity-40 uppercase">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(s.created_at).toLocaleDateString()}</span>
                                    {s.waiver_completed ? (
                                        <span className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 size={12} /> Waiver Complete</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-amber-500"><AlertCircle size={12} /> Waiver Missing</span>
                                    )}
                                </div>
                                
                                {s.stripe_session_id && (
                                    <a 
                                        href={`https://dashboard.stripe.com/payments`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                                    >
                                        Stripe Transaction <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
