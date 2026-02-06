"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import {
    Database, FileSpreadsheet, BarChart3,
    RefreshCw, Plus
} from 'lucide-react';
import TrainingInsights from '@/components/TrainingInsights';
import { Button } from '@/components/ui/Button';
import { RosterTable } from '@/components/admin/RosterTable';
import { SessionLog } from '@/components/admin/SessionLog';
import { CsvUpload } from '@/components/admin/CsvUpload';
import { ManualEntryForm } from '@/components/admin/ManualEntryForm';
import { DEMO_ADMIN_EMAIL } from '@/utils/demo-utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AdminDashboard() {
    const { user, userRole, userEmail } = useAuth();
    const {
        dbData, sessions, coaches, isLoading, refreshAll,
        actions
    } = useAdminData();

    // UI State
    const [activeTab, setActiveTab] = useState<'roster' | 'insights' | 'sessions'>('roster');
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Security Check (simple UI gate, real protection in middleware/RLS)
    const isAdmin = userRole === 'admin' || userEmail === DEMO_ADMIN_EMAIL; // Legacy override support

    if (!isAdmin && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Access Denied.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <ErrorBoundary>
                <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center glass p-6 rounded-2xl">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground">
                            Admin Console
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-muted-foreground font-medium">Master Command Center</p>
                            {user && (
                                <>
                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold bg-primary/10 text-primary`}>
                                        ADMIN
                                    </span>
                                    <span className="text-xs text-muted-foreground">({userEmail})</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('roster')}
                            className={`px-4 py-2 rounded-md gap-2 ${activeTab === 'roster' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Database size={16} /> Roster
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('sessions')}
                            className={`px-4 py-2 rounded-md gap-2 ${activeTab === 'sessions' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FileSpreadsheet size={16} /> Event Log
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('insights')}
                            className={`px-4 py-2 rounded-md gap-2 ${activeTab === 'insights' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <BarChart3 size={16} /> Training Dashboard
                        </Button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto space-y-8">
                    {activeTab === 'insights' ? (
                        <TrainingInsights />
                    ) : activeTab === 'sessions' ? (
                        <SessionLog
                            sessions={sessions}
                            onDelete={actions.deleteSession}
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Import Section */}
                                <CsvUpload
                                    onUpload={actions.uploadCsv}
                                    rosterData={dbData}
                                />

                                {/* Database Table */}
                                <div className="glass rounded-2xl p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Database className="text-primary" />
                                            Roster Database
                                        </h2>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm('EXTREME DANGER: This will delete ALL roster and session data. Are you sure?')) {
                                                        actions.resetDatabase();
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            >
                                                Reset Database
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm("Recalculate all stats from session logs?")) actions.recalculateCounts();
                                                }}
                                                className="px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 gap-2"
                                                title="Sync counts with actual session records"
                                            >
                                                <RefreshCw size={14} />
                                                Recalc
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingItem(null);
                                                    setShowManualAdd(true);
                                                }}
                                                className="px-4 py-2 bg-white text-black hover:scale-105"
                                            >
                                                <Plus size={16} /> Add Manual Entry
                                            </Button>
                                        </div>
                                    </div>

                                    <RosterTable
                                        data={dbData}
                                        onDelete={(id) => {
                                            if (confirm("Delete this goalie and all their sessions?")) actions.deleteGoalie(id);
                                        }}
                                        onEdit={(item) => {
                                            setEditingItem(item);
                                            setShowManualAdd(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stats Sidebar */}
                            <div className="space-y-6">
                                <div className="glass p-6 rounded-2xl">
                                    <div className="text-4xl font-black text-foreground">{dbData.length}</div>
                                    <div className="text-sm text-muted-foreground">Total Roster</div>
                                </div>
                                <div className="glass p-6 rounded-2xl">
                                    <div className="text-4xl font-black text-primary">{dbData.filter(d => d.is_claimed).length}</div>
                                    <div className="text-sm text-muted-foreground">Active Users</div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <ManualEntryForm
                    isOpen={showManualAdd}
                    onClose={() => setShowManualAdd(false)}
                    editItem={editingItem}
                    coaches={coaches}
                    onSuccess={() => {
                        refreshAll();
                        // actions.refreshAll is called internally by hook if we want, but explicit refresh here ensures UI sync
                    }}
                />
            </ErrorBoundary>
        </div>
    );
}
