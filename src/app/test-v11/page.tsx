"use client";

import { useEffect, useState, Suspense } from "react";
import { GoalieDashboard } from "@/components/goalie/GoalieDashboard";
import { SupportedSport } from "@/types/goalie-v11";

export default function TestV11Page() {
    const [goalieIndex, setGoalieIndex] = useState(0); // Default to Lacrosse

    useEffect(() => {
        // Clear AI cache for testing rules
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('ai_plan_')) localStorage.removeItem(key);
        });
    }, []);

    // Mock Goalie Data with initial clips for report verification
    const mockGoalies = [
        {
            id: "lacrosse-test",
            name: "Lacrosse Athlete",
            sport: "lacrosse-boys" as SupportedSport,
            latestMood: "happy",
            gradYear: "2027",
            stats: { gaa: "8.2", sv: "0.580", games: 12 },
            events: [{ id: 'm1', name: 'Game: vs Wolves', date: new Date().toISOString(), location: 'Away', status: 'past', image: '', video_id: 'v1' }],
            unchartedClips: [
                { id: 'c1', timestamp: 10, type: 'save', status: 'pending', period: 1 },
                { id: 'c2', timestamp: 120, type: 'goal', status: 'pending', period: 2 },
                { id: 'c3', timestamp: 240, type: 'save', status: 'pending', period: 3 },
                { id: 'c4', timestamp: 360, type: 'save', status: 'pending', period: 4 },
            ]
        },
        {
            id: "hockey-test",
            name: "Hockey Athlete",
            sport: "hockey" as SupportedSport,
            latestMood: "happy",
            gradYear: "2026",
            stats: { gaa: "1.95", sv: "0.925", games: 10 },
            events: [{ id: 'm2', name: 'Game: vs Predators', date: new Date().toISOString(), location: 'Home', status: 'past', image: '', video_id: 'v2' }],
            unchartedClips: [
                { id: 'h1', timestamp: 15, type: 'save', status: 'pending', period: 1 },
                { id: 'h2', timestamp: 145, type: 'goal', status: 'pending', period: 2 },
                { id: 'h3', timestamp: 300, type: 'save', status: 'pending', period: 3 },
            ]
        },
        {
            id: "soccer-test",
            name: "Soccer Athlete",
            sport: "soccer" as SupportedSport,
            latestMood: "neutral",
            gradYear: "2025",
            stats: { gaa: "1.20", sv: "0.850", games: 8 },
            events: [{ id: 'm3', name: 'Game: vs United', date: new Date().toISOString(), location: 'Neutral', status: 'past', image: '', video_id: 'v3' }],
            unchartedClips: [
                { id: 's1', timestamp: 20, type: 'save', status: 'pending', period: 1 },
                { id: 's2', timestamp: 180, type: 'goal', status: 'pending', period: 2 },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background relative pt-10">
            {/* SPORT SWITCHER REMOVED - PER USER DIRECTION */}

            <Suspense fallback={<div className="p-20 text-center text-zinc-500 uppercase font-black tracking-widest animate-pulse">Loading Test Rig...</div>}>
                <GoalieDashboard 
                    goalies={[mockGoalies[goalieIndex]]}
                    userRole="goalie"
                    userId={mockGoalies[goalieIndex].id}
                    notification={null}
                    notifications={[]}
                    onDismissNotification={() => {}}
                    onLogout={() => {}}
                    onRegister={() => {}}
                    onLogAction={(a) => console.log("Action:", a)}
                    onCoachUpdate={() => {}}
                    journalPrefill=""
                />
            </Suspense>
        </div>
    );
}
