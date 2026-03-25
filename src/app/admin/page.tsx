"use client";

import { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { RosterTable } from '@/components/admin/RosterTable';
import { SessionsTable } from '@/components/admin/SessionsTable';
import { CSVUploadSection } from '@/components/admin/CSVUploadSection';
import { ManualEntryModal } from '@/components/admin/ManualEntryModal';
import TrainingInsights from '@/components/TrainingInsights';
import { RosterItem } from '@/types';
import { FeedbackTable } from '@/components/admin/FeedbackTable';
import { BetaSurveyTable } from '@/components/admin/BetaSurveyTable';
import { CreditManager } from '@/components/admin/CreditManager';
import { DataIntegrityWidget } from '@/components/admin/DataIntegrityWidget';
import { PrivateAccessSubmissions } from '@/components/admin/PrivateAccessSubmissions';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard() {
    // Logic extracted to hook
    const {
        dbData,
        coaches,
        sessions,
        feedback,
        isLoading,
        currentUser,
        fetchRoster,
        recalculateCounts,
        handleDelete,
        setSessions
    } = useAdminData();

    // UI State
    const [activeTab, setActiveTab] = useState<'roster' | 'insights' | 'sessions' | 'feedback' | 'survey' | 'credits' | 'private-access'>('roster');
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<RosterItem | null>(null);
    const [creditBalances, setCreditBalances] = useState<Record<string, number>>({});

    // Fetch credit balances for all goalies
    const fetchCreditBalances = async () => {
        const { data } = await supabase
            .from('credit_transactions')
            .select('roster_id, amount');
        if (!data) return;
        const balances: Record<string, number> = {};
        data.forEach((tx: any) => {
            balances[tx.roster_id] = (balances[tx.roster_id] || 0) + tx.amount;
        });
        setCreditBalances(balances);
    };

    useEffect(() => {
        if (activeTab === 'credits') fetchCreditBalances();
    }, [activeTab]);

    const handleEditClick = (item: RosterItem) => {
        setEditingId(item.id);
        setEditingItem(item);
        setShowManualAdd(true);
    };

    const handleAddClick = () => {
        setEditingId(null);
        setEditingItem(null);
        setShowManualAdd(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <AdminHeader
                currentUser={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="max-w-7xl mx-auto space-y-8">
                {activeTab === 'insights' ? (
                    <TrainingInsights />
                ) : activeTab === 'sessions' ? (
                    <SessionsTable
                        sessions={sessions}
                        setSessions={setSessions}
                    />
                ) : activeTab === 'feedback' ? (
                    <FeedbackTable
                        feedback={feedback}
                        isLoading={isLoading}
                    />
                ) : activeTab === 'survey' ? (
                    <BetaSurveyTable
                        feedback={feedback}
                        isLoading={isLoading}
                    />
                ) : activeTab === 'credits' ? (
                    <div className="space-y-4">
                        <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Lesson Credits — All Goalies</div>
                        {dbData.length === 0 && <p className="text-muted-foreground text-sm">No goalies found.</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dbData
                                .filter((g: RosterItem) => g.role !== 'coach')
                                .map((g: RosterItem) => (
                                    <CreditManager
                                        key={g.id}
                                        rosterId={g.id}
                                        goalieName={g.goalie_name || 'Goalie'}
                                        currentCredits={creditBalances[g.id] || 0}
                                        onCreditsAdded={fetchCreditBalances}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ) : activeTab === 'private-access' ? (
                    <PrivateAccessSubmissions />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Import Section */}
                            <CSVUploadSection
                                dbData={dbData}
                                onUploadComplete={fetchRoster}
                            />

                            {/* Database Table */}
                            <RosterTable
                                dbData={dbData}
                                onRefresh={fetchRoster}
                                onRecalculate={recalculateCounts}
                                onDelete={handleDelete}
                                onEdit={handleEditClick}
                                onAdd={handleAddClick}
                            />
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-8">
                            <AdminStats dbData={dbData} />
                            <DataIntegrityWidget />
                        </div>
                    </div>
                )}
            </main>

            {/* Manual Edit Modal */}
            <ManualEntryModal
                isOpen={showManualAdd}
                onClose={() => setShowManualAdd(false)}
                editingId={editingId}
                initialData={editingItem}
                dbData={dbData}
                coaches={coaches}
                onSave={fetchRoster}
            />
        </div>
    );
}
