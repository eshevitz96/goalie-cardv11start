import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { determineUserRole, isPastSeniorSeason } from '../utils/role-logic';
import { SCHOOL_YEAR_END_MONTH, LEGAL_AGE } from '../constants/app-constants';

describe('Role Logic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isPastSeniorSeason', () => {
        it('should return true if current date is after July 1st of grad year', () => {
            // Set date to July 2nd, 2030
            vi.setSystemTime(new Date(2030, 6, 2));
            expect(isPastSeniorSeason(2030)).toBe(true);
        });

        it('should return false if current date is before July 1st of grad year', () => {
            // Set date to June 30th, 2030
            vi.setSystemTime(new Date(2030, 5, 30));
            expect(isPastSeniorSeason(2030)).toBe(false);
        });
    });

    describe('determineUserRole', () => {
        it('should return "goalie" if past senior season', () => {
            vi.setSystemTime(new Date(2030, 7, 1)); // Aug 1 2030
            // Even if age < 18, grad year overrides
            expect(determineUserRole('2012-01-01', 2030)).toBe('goalie');
        });

        it('should return "parent" if NOT past senior season', () => {
            vi.setSystemTime(new Date(2030, 0, 1)); // Jan 1 2030
            expect(determineUserRole('2013-01-01', 2030)).toBe('parent');
        });

        it('should return "goalie" if age >= LEGAL_AGE (18) and no grad year', () => {
            vi.setSystemTime(new Date(2030, 0, 1));
            // Born 2010 -> 20 years old in 2030 -> Goalie
            expect(determineUserRole('2010-01-01')).toBe('goalie');
        });

        it('should return "parent" if age < LEGAL_AGE (18) and no grad year', () => {
            vi.setSystemTime(new Date(2030, 0, 1));
            // Born 2020 -> 10 years old -> Parent
            expect(determineUserRole('2020-01-01')).toBe('parent');
        });
    });
});
