import { DrillDef } from "../expert-engine";

export const SEASON_PROTOCOLS: Record<string, Record<string, DrillDef>> = {
    "off-season": {
        default: {
            name: "Foundation & Strength",
            duration: "20 mins",
            type: "physical",
            steps: [
                "Heavy focus on explosive movement (plyometrics).",
                "Deep edge work and mobility drills.",
                "Strength building for core and lower body."
            ]
        }
    },
    "pre-season": {
        default: {
            name: "Technical Refinement",
            duration: "20 mins",
            type: "physical",
            steps: [
                "High-volume repetition of basic save selections.",
                "Conditioning focused on lateral speed.",
                "Positional awareness and angle work."
            ]
        }
    },
    "in-season": {
        default: {
            name: "Maintenance & Recovery",
            duration: "15 mins",
            type: "physical",
            steps: [
                "Focus on efficiency and minimal necessary movement.",
                "Recovery-focused mobility work.",
                "Tactical analysis and short-burst speed drills."
            ]
        }
    },
    "playoffs": {
        default: {
            name: "Peak Performance & Precision",
            duration: "10 mins",
            type: "physical",
            steps: [
                "Extremely high focus on visual tracking.",
                "Precision movement: no 'leaks' in save execution.",
                "Mental visualization of playoff scenarios."
            ]
        }
    }
};

export const CAREER_PROTOCOLS: Record<string, DrillDef> = {
    "youth": {
        name: "Skill Acquisition",
        duration: "20 mins",
        type: "physical",
        steps: [
            "Fun-based hand-eye coordination games.",
            "Basics of stance and movement.",
            "Visual tracking of the puck/ball."
        ]
    },
    "high-school": {
        name: "Performance Optimization",
        duration: "20 mins",
        type: "physical",
        steps: [
            "Integration of advanced tactical reads.",
            "Increased focus on off-ice conditioning impact.",
            "Mental game strategy and resilience."
        ]
    },
    "college-pro": {
        name: "Elite Maintenance",
        duration: "15 mins",
        type: "physical",
        steps: [
            "Highly specific edge work and small-area quickness.",
            "Data-driven technical adjustments.",
            "Advanced recovery and longevity protocols."
        ]
    }
};
