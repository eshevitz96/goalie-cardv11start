import Link from 'next/link';
import { Database, FileSpreadsheet, BarChart3, MessageSquare, CheckCircle2, CreditCard, Lock, LayoutDashboard } from 'lucide-react';

type AdminTab = 'roster' | 'insights' | 'sessions' | 'feedback' | 'survey' | 'credits' | 'private-access';

interface AdminHeaderProps {
    currentUser: any;
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
}

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'roster',         label: 'Roster',          icon: <Database size={15} /> },
    { id: 'sessions',       label: 'Events',           icon: <FileSpreadsheet size={15} /> },
    { id: 'feedback',       label: 'Feedback',         icon: <MessageSquare size={15} /> },
    { id: 'survey',         label: 'Survey',           icon: <CheckCircle2 size={15} /> },
    { id: 'credits',        label: 'Credits',          icon: <CreditCard size={15} /> },
    { id: 'private-access', label: 'Access',           icon: <Lock size={15} /> },
    { id: 'insights',       label: 'Insights',         icon: <BarChart3 size={15} /> },
];

export function AdminHeader({ currentUser, activeTab, setActiveTab }: AdminHeaderProps) {
    return (
        <header className="max-w-7xl mx-auto mb-8">
            {/* Top row: title + my card link */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
                    {currentUser && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                            {currentUser.email}
                        </p>
                    )}
                </div>
                <Link
                    href="/dashboard?view=goalie"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                >
                    <LayoutDashboard size={14} />
                    <span>My Card</span>
                </Link>
            </div>

            {/* Nav tabs — wrap on mobile */}
            <div className="flex flex-wrap gap-1.5 bg-muted/50 border border-border rounded-xl p-1.5">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-foreground text-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </header>
    );
}
