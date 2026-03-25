import { Database, FileSpreadsheet, BarChart3, MessageSquare, CheckCircle2, CreditCard, Lock } from 'lucide-react';

type AdminTab = 'roster' | 'insights' | 'sessions' | 'feedback' | 'survey' | 'credits' | 'private-access';

interface AdminHeaderProps {
    currentUser: any;
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
}

export function AdminHeader({ currentUser, activeTab, setActiveTab }: AdminHeaderProps) {
    return (
        <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center glass p-6 rounded-2xl">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    Admin Console
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-muted-foreground font-medium">Master Command Center</p>
                    {currentUser && (
                        <>
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${currentUser.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                                {currentUser.role}
                            </span>
                            <span className="text-xs text-muted-foreground">({currentUser.email})</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'roster' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Database size={16} /> Roster
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <FileSpreadsheet size={16} /> Event Log
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'feedback' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <MessageSquare size={16} /> Feedback
                </button>
                <button
                    onClick={() => setActiveTab('survey')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'survey' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <CheckCircle2 size={16} /> Beta Survey
                </button>
                <button
                    onClick={() => setActiveTab('credits')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'credits' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <CreditCard size={16} /> Credits
                </button>
                <button
                    onClick={() => setActiveTab('private-access')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'private-access' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Lock size={16} /> Private Access
                </button>
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <BarChart3 size={16} /> Training Dashboard
                </button>
            </div>
        </header>
    );
}
