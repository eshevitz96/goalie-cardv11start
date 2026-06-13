import { useMemo } from 'react';

interface SeasonBlock {
    name: string;
    startMonth: number; // 1-indexed (1 = Jan, 12 = Dec)
    startDay: number;
    endMonth: number;   // 1-indexed
    endDay: number;
}

const SPORT_CALENDARS: Record<string, SeasonBlock[]> = {
    lacrosse: [
        { name: "Spring Season", startMonth: 2, startDay: 1, endMonth: 5, endDay: 15 },
        { name: "Summer Training", startMonth: 5, startDay: 16, endMonth: 8, endDay: 15 },
        { name: "Fall Ball", startMonth: 8, startDay: 16, endMonth: 11, endDay: 30 },
        { name: "Winter Training", startMonth: 12, startDay: 1, endMonth: 1, endDay: 31 }
    ],
    hockey: [
        { name: "Spring/Summer Development", startMonth: 5, startDay: 1, endMonth: 8, endDay: 31 },
        { name: "Pre-Season", startMonth: 9, startDay: 1, endMonth: 10, endDay: 14 },
        { name: "Regular Season", startMonth: 10, startDay: 15, endMonth: 3, endDay: 15 },
        { name: "Playoffs", startMonth: 3, startDay: 16, endMonth: 4, endDay: 30 }
    ],
    soccer: [
        { name: "Summer Offseason", startMonth: 6, startDay: 1, endMonth: 7, endDay: 31 },
        { name: "Pre-Season", startMonth: 8, startDay: 1, endMonth: 8, endDay: 31 },
        { name: "Fall Season", startMonth: 9, startDay: 1, endMonth: 11, endDay: 30 },
        { name: "Winter Training", startMonth: 12, startDay: 1, endMonth: 2, endDay: 28 }, // handles leap years safely
        { name: "Spring Season", startMonth: 3, startDay: 1, endMonth: 5, endDay: 31 }
    ]
};

function normalizeSport(rawSport: string | null | undefined): string | null {
    if (!rawSport) return null;
    const s = rawSport.toLowerCase();
    if (s.includes('lacrosse')) return 'lacrosse';
    if (s.includes('hockey')) return 'hockey';
    if (s.includes('soccer')) return 'soccer';
    return s;
}

export function useSeasonTimeline(sport: string | null | undefined, todayDateInput?: Date) {
    const { seasonProgress, seasonLabel } = useMemo(() => {
        const today = todayDateInput ? new Date(todayDateInput) : new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 1-indexed
        
        const normalizedSport = normalizeSport(sport);
        
        if (!normalizedSport) {
            return { seasonProgress: null, seasonLabel: "OFF-SEASON" };
        }
        
        const blocks = SPORT_CALENDARS[normalizedSport];
        if (!blocks) {
            return { seasonProgress: null, seasonLabel: "OFF-SEASON" };
        }
        
        let activeBlock: SeasonBlock | null = null;
        let start: Date | null = null;
        let end: Date | null = null;
        
        for (const block of blocks) {
            let blockStart: Date;
            let blockEnd: Date;
            
            if (block.startMonth <= block.endMonth) {
                // Same calendar year block
                blockStart = new Date(year, block.startMonth - 1, block.startDay, 0, 0, 0, 0);
                blockEnd = new Date(year, block.endMonth - 1, block.endDay, 23, 59, 59, 999);
                
                if (today >= blockStart && today <= blockEnd) {
                    activeBlock = block;
                    start = blockStart;
                    end = blockEnd;
                    break;
                }
            } else {
                // Spans calendar year boundary (e.g. Dec 1 to Jan 31)
                if (month >= block.startMonth) {
                    blockStart = new Date(year, block.startMonth - 1, block.startDay, 0, 0, 0, 0);
                    blockEnd = new Date(year + 1, block.endMonth - 1, block.endDay, 23, 59, 59, 999);
                    
                    if (today >= blockStart && today <= blockEnd) {
                        activeBlock = block;
                        start = blockStart;
                        end = blockEnd;
                        break;
                    }
                } else if (month <= block.endMonth) {
                    blockStart = new Date(year - 1, block.startMonth - 1, block.startDay, 0, 0, 0, 0);
                    blockEnd = new Date(year, block.endMonth - 1, block.endDay, 23, 59, 59, 999);
                    
                    if (today >= blockStart && today <= blockEnd) {
                        activeBlock = block;
                        start = blockStart;
                        end = blockEnd;
                        break;
                    }
                }
            }
        }
        
        if (!activeBlock || !start || !end) {
            return { seasonProgress: null, seasonLabel: "OFF-SEASON" };
        }
        
        // Calculate total and elapsed days in whole calendar days (inclusive of start and end days)
        const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        
        const totalDays = Math.round((endMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const elapsedDays = Math.round((todayMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const progress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
        
        let blockYearLabel = "";
        if (activeBlock.startMonth <= activeBlock.endMonth) {
            blockYearLabel = `${start.getFullYear()}`;
        } else {
            blockYearLabel = `${start.getFullYear()}-${(start.getFullYear() + 1).toString().slice(-2)}`;
        }
        
        return {
            seasonProgress: progress,
            seasonLabel: `${activeBlock.name} ${blockYearLabel}`
        };
    }, [sport, todayDateInput]);
    
    return { seasonProgress, seasonLabel };
}
