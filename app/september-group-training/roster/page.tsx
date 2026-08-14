"use client";

import { useState } from "react";
import { fetchAdminRoster, deleteSubmission } from "./actions";
import { Loader2, Lock, ArrowRight, ShieldCheck, Download, ChevronLeft, Trash2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminRosterPage() {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [rosterData, setRosterData] = useState<any[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetchAdminRoster(password);
            if (res.error) {
                setError(res.error);
            } else if (res.data) {
                setRosterData(res.data);
                setIsAuthenticated(true);
            }
        } catch (err: any) {
            setError("Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this pending submission?")) return;
        
        setIsLoading(true);
        try {
            const res = await deleteSubmission(id, password);
            if (res.error) {
                alert(res.error);
            } else {
                setRosterData(prev => prev.filter(s => s.id !== id));
            }
        } catch (err) {
            alert("Failed to delete.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative">
                <Link href="/dashboard" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
                    <ChevronLeft size={16} /> Back to Goalie Card
                </Link>
                <div className="w-full max-w-sm bg-white rounded-[2rem] border-2 border-slate-200 p-8 shadow-xl">
                    <div className="flex flex-col items-center mb-8">
                        <BrandLogo size={14} className="mb-4" />
                        <h1 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Admin Roster</h1>
                        <p className="text-sm font-sans text-slate-500 mt-1">September Group Training</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-0 text-slate-900 transition-colors font-medium outline-none"
                                    placeholder="Enter access code"
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="text-red-500 text-xs font-bold text-center mt-2">
                                {error}
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            className="w-full py-4 mt-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                            loading={isLoading}
                        >
                            Unlock Dashboard <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </form>
                </div>
            </main>
        );
    }

    const TARGET_DATES = ['Sept 5', 'Sept 12', 'Sept 19'];
    const MAX_CAPACITY = 5;

    // Filter to only count those who have selected dates (in progress or paid)
    const validSubmissions = rosterData.filter(s => Array.isArray(s.selected_dates) && s.selected_dates.length > 0);

    const getCapacityForDate = (date: string) => {
        return validSubmissions.filter(s => s.selected_dates.includes(date) && s.payment_status === 'paid').length;
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans font-bold text-slate-900">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-green-600 font-bold text-sm">
                            <ShieldCheck size={16} /> Secure Admin View
                        </div>
                        <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight">September Training Roster</h1>
                    </div>
                </div>

                {/* Capacity Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TARGET_DATES.map(date => {
                        const count = getCapacityForDate(date);
                        const isFull = count >= MAX_CAPACITY;
                        return (
                            <div key={date} className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="font-sans font-bold text-xl mb-1">{date}</h3>
                                    <p className="text-xs font-sans font-bold uppercase tracking-widest text-slate-400">Capacity</p>
                                </div>
                                <div className="mt-6 flex items-end justify-between">
                                    <div className="text-4xl font-bold tracking-tighter">
                                        {count}<span className="text-xl text-slate-400 font-medium tracking-normal">/{MAX_CAPACITY}</span>
                                    </div>
                                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${isFull ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                        {isFull ? 'FULL' : 'AVAILABLE'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Date-by-Date Breakdown */}
                <div className="space-y-8">
                    {TARGET_DATES.map(date => {
                        const dateSubmissions = validSubmissions.filter(s => s.selected_dates.includes(date));
                        
                        return (
                            <div key={date} className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                                    <h2 className="font-sans font-bold text-xl">{date} Roster</h2>
                                    <span className="text-sm font-sans font-medium opacity-80">{dateSubmissions.length} Goalies</span>
                                </div>
                                <div className="p-0">
                                    {dateSubmissions.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 font-medium">
                                            No registrations yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {dateSubmissions.map((sub, i) => (
                                                <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-500 shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-sans font-bold text-lg">{sub.athlete_name}</h4>
                                                            {sub.parent_name && <p className="text-sm font-sans text-slate-500">Parent: {sub.parent_name}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm space-y-1">
                                                        <p className="font-medium">{sub.email}</p>
                                                        <p className="text-slate-500">{sub.phone}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            sub.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 
                                                            sub.payment_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {sub.payment_status?.toUpperCase() || 'UNKNOWN'}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            sub.waiver_completed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                            WAIVER: {sub.waiver_completed ? 'YES' : 'NO'}
                                                        </span>
                                                        {sub.payment_status !== 'paid' && (
                                                            <button 
                                                                onClick={() => handleDelete(sub.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
                                                                title="Delete pending submission"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
