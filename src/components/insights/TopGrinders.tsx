import React from 'react';

interface TopGrindersProps {
    grinders: { id: string; name: string; count: number; breakdown: string }[];
}

export function TopGrinders({ grinders }: TopGrindersProps) {
    return (
        <div className="glass p-6 rounded-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-primary">★</span> Top Grinders (All-Time Leaders)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grinders?.map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {i + 1}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">{g.name}</div>
                                <div className="text-xs text-muted-foreground">Rank #{i + 1}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-amber-500">{g.count}</div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Sessions</div>
                        </div>
                    </div>
                )) || <p className="text-gray-500 text-sm">No data yet.</p>}
            </div>
        </div>
    );
}
