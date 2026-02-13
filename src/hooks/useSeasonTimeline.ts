import { useMemo } from 'react';

export function useSeasonTimeline() {
    const seasonProgress = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        // Season starts Sept 1st (Month 8 in JS 0-indexed)
        const start = new Date(currentYear, 8, 1).getTime();
        // Season ends April 30th (Month 3) of next year
        const end = new Date(currentYear + 1, 3, 30).getTime();

        // Adjust for "rollover" vs "mid-season"
        // If we are in Jan-May (month < 5), we are in the tail end of the season started prev year
        const effectiveStart = now.getMonth() < 5 ? new Date(currentYear - 1, 8, 1).getTime() : start;
        const effectiveEnd = now.getMonth() < 5 ? new Date(currentYear, 3, 30).getTime() : end;

        const total = effectiveEnd - effectiveStart;
        const current = now.getTime() - effectiveStart;

        return Math.max(0, Math.min(100, (current / total) * 100));
    }, []);

    const seasonLabel = useMemo(() => {
        const date = new Date();
        const year = date.getFullYear();
        // Season turnover ~July 1st
        // If month is < 6 (Jan-June), we are in the season causing year-1
        const startYear = date.getMonth() < 6 ? year - 1 : year;
        return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
    }, []);

    return { seasonProgress, seasonLabel };
}
