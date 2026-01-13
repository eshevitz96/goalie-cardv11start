"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// --- Types ---
export interface GoalieProfile {
    id: number;
    name: string;
    coach: string;
    session: number;
    lesson: number;
    stats: { gaa: string; sv: string };
    events: any[];
    feedback: any[];
}

export interface ActivationRequest {
    id: string;
    parentName: string;
    goalieName: string;
    coachId: string;
    status: "pending" | "approved" | "completed";
    activationCode?: string;
}

export interface RosterEntry {
    emails: string[];
    parentName: string;
    goalieName: string;
    gradYear: string;
    gcId: string;
    session: number;
    lesson: number;
    status: string;
}

interface AppContextType {
    // Parent Data
    myGoalies: GoalieProfile[];
    addGoalie: (goalie: GoalieProfile) => void;

    // Activation Flow
    activationRequests: ActivationRequest[];
    submitActivationRequest: (req: Omit<ActivationRequest, "status" | "id">) => void;
    approveActivationRequest: (id: string, code: string) => void;

    // Coach Data
    availableSlots: any[];
    addSlot: (slot: any) => void;
    removeSlot: (id: number) => void;

    // Roster Check
    checkRoster: (email: string) => RosterEntry | null;
}

// --- Mock Initial Data ---
const MASTER_ROSTER: RosterEntry[] = [
    {
        emails: ["sarah@example.com", "sarah.vance@work.com"],
        parentName: "Sarah Vance",
        goalieName: "Leo Vance",
        gradYear: "2028",
        gcId: "GC-2024-L8V",
        session: 1,
        lesson: 4,
        status: "active"
    },
    {
        emails: ["mike@example.com"],
        parentName: "Mike Ross",
        goalieName: "Jamie Ross",
        gradYear: "2030",
        gcId: "GC-2024-J9R",
        session: 2,
        lesson: 1,
        status: "active"
    }
];

const INITIAL_GOALIES: GoalieProfile[] = [
    {
        id: 1,
        name: "Leo Vance",
        coach: "Coach Mike",
        session: 1,
        lesson: 4,
        stats: { gaa: "2.10", sv: ".925" },
        events: [
            {
                id: 1,
                name: "GS Baltimore Camp",
                date: "Dec 12-14, 2024",
                location: "Reistertown Sportsplex",
                status: "upcoming",
                image: "from-blue-600 to-indigo-600"
            }
        ],
        feedback: [
            {
                id: 1,
                date: "Today, 10:00 AM",
                coach: "Coach Mike",
                title: "Glove Hand Precision",
                content: "Leo was electric today. We really focused on keeping that glove hand elevated during the butterfly slide.",
                rating: 5,
                hasVideo: true,
            }
        ]
    }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    // State
    const [myGoalies, setMyGoalies] = useState<GoalieProfile[]>(INITIAL_GOALIES);
    const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([
        { id: 101, day: "Wed, Dec 14", time: "4:00 PM" },
        { id: 102, day: "Wed, Dec 14", time: "5:30 PM" },
    ]);

    // Actions
    const addGoalie = (goalie: GoalieProfile) => {
        setMyGoalies(prev => [...prev, goalie]);
    };

    const submitActivationRequest = (req: Omit<ActivationRequest, "status" | "id">) => {
        const newReq: ActivationRequest = { ...req, status: "pending", id: Math.random().toString(36).substr(2, 9) };
        setActivationRequests(prev => [...prev, newReq]);
    };

    const approveActivationRequest = (id: string, code: string) => {
        setActivationRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: "approved", activationCode: code } : req
        ));
    };

    const checkRoster = (email: string) => {
        return MASTER_ROSTER.find(r => r.emails.some(e => e.toLowerCase() === email.toLowerCase())) || null;
    };

    const addSlot = (slot: any) => setAvailableSlots(prev => [...prev, slot]);
    const removeSlot = (id: number) => setAvailableSlots(prev => prev.filter(s => s.id !== id));

    return (
        <AppContext.Provider value={{
            myGoalies,
            addGoalie,
            activationRequests,
            submitActivationRequest,
            approveActivationRequest,
            checkRoster,
            availableSlots,
            addSlot,
            removeSlot
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}
