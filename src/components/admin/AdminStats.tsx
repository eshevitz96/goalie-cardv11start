import { RosterItem } from '@/types';

interface AdminStatsProps {
    dbData: RosterItem[];
}

export function AdminStats({ dbData }: AdminStatsProps) {
    return (
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
    );
}
