import { useMemo } from 'react';

export function useSeasonTimeline(sport: string = 'Hockey') {
    const seasonProgress = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        let startMonth = 8; // Sept (Hockey default)
        let endMonth = 3;   // April (Hockey default)
        let endYearOffset = 1;

        // Custom windows per sport
        const normalizedSport = sport?.toLowerCase() || 'hockey';

        if (normalizedSport.includes('soccer')) {
            startMonth = 7; // August
            endMonth = 11;  // December
            endYearOffset = 0;
        } else if (normalizedSport.includes('lacrosse')) {
            startMonth = 1; // February
            endMonth = 5;   // June
            endYearOffset = 0;
        }

        // Logic for rollover/mid-season
        let effectiveStartYear = currentYear;
        let effectiveEndYear = currentYear + endYearOffset;

        if (endYearOffset === 1) {
            // Split-year season (like Hockey)
            if (currentMonth <= endMonth + 1) { // Grace period after season end
                effectiveStartYear = currentYear - 1;
                effectiveEndYear = currentYear;
            }
        } else {
            // Single-year season (like Soccer/Lacrosse)
            if (currentMonth < startMonth && currentMonth > endMonth) {
                // We are between seasons, show upcoming or finished?
                // For progress bar, we usually want to show progress of ACTIVE season.
                // If we are before start, show 0%. If after end, show 100%.
                if (currentMonth > endMonth) return 100;
                if (currentMonth < startMonth) return 0;
            }
        }

        const start = new Date(effectiveStartYear, startMonth, 1).getTime();
        const end = new Date(effectiveEndYear, endMonth, 30).getTime();

        const total = end - start;
        const current = now.getTime() - start;

        return Math.max(0, Math.min(100, (current / total) * 100));
    }, [sport]);

    const seasonLabel = useMemo(() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();

        const normalizedSport = sport?.toLowerCase() || 'hockey';

        if (normalizedSport.includes('soccer') || normalizedSport.includes('lacrosse')) {
            return `${year} Season`;
        }

        // Hockey split-year logic
        const startYear = month < 6 ? year - 1 : year;
        return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
    }, [sport]);

    return { seasonProgress, seasonLabel };
}
