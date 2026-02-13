"use client";

import { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { RosterTable } from '@/components/admin/RosterTable';
import { SessionsTable } from '@/components/admin/SessionsTable';
import { CSVUploadSection } from '@/components/admin/CSVUploadSection';
import { ManualEntryModal } from '@/components/admin/ManualEntryModal';
import TrainingInsights from '@/components/TrainingInsights';
import { RosterItem } from '@/types';

export default function AdminDashboard() {
    // Logic extracted to hook
    const {
        dbData,
        coaches,
        sessions,
        currentUser,
        fetchRoster,
        recalculateCounts,
        handleDelete,
        setSessions
    } = useAdminData();

    // UI State
    const [activeTab, setActiveTab] = useState<'roster' | 'insights' | 'sessions'>('roster');
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<RosterItem | null>(null);

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
                        <AdminStats dbData={dbData} />
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
