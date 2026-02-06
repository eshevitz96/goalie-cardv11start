import { describe, it, expect } from 'vitest';
import { isDemoId, getDemoGoalie, DEMO_GOALIE_ID } from '../utils/demo-utils';

describe('Demo Utils', () => {
    describe('isDemoId', () => {
        it('should return true for IDs starting with demo-', () => {
            expect(isDemoId('demo-123')).toBe(true);
            expect(isDemoId('demo-user')).toBe(true);
        });

        it('should return false for regular IDs', () => {
            expect(isDemoId('user-123')).toBe(false);
            expect(isDemoId('12345')).toBe(false);
        });
    });

    describe('getDemoGoalie', () => {
        it('should return null for non-demo ID', () => {
            expect(getDemoGoalie('some-real-id')).toBeNull();
        });

        it('should return demo goalie object for valid demo ID', () => {
            const demo = getDemoGoalie(DEMO_GOALIE_ID);
            expect(demo).not.toBeNull();
            expect(demo?.id).toBe(DEMO_GOALIE_ID);
            expect(demo?.goalie_name).toBe("Demo Goalie");
        });
    });
});
