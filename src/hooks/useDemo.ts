import { useState, useEffect } from 'react';
import { isDemoId } from '@/utils/demo-utils';

export function useDemo() {
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        // Check if global demo mode flag is set
        const stored = localStorage.getItem('demo_mode');
        setIsDemoMode(stored === 'true');
    }, []);

    return { isDemoMode, isDemoId };
}
