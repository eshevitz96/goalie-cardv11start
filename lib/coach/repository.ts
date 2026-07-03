import { supabase } from "@/utils/supabase/client";
import { AthleteProfile, Mission, Session, Reflection, LearningResult } from "./types";
import { GLADIATORS_KNOWLEDGE_BASE } from "./knowledge-base";

// Helper to determine if we can use cloud database
async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
    } catch (e) {
        return null;
    }
}

export function mapMissionFromDb(row: any): Mission {
    const blocksData = Array.isArray(row.blocks) ? row.blocks : (row.blocks?.blocks || []);
    const meta = Array.isArray(row.blocks) ? {} : row.blocks;
    
    return {
        id: row.id,
        user_id: row.user_id,
        contract_id: row.contract_id,
        mission_date: row.mission_date,
        day_number: row.day_number,
        title: row.title,
        directive: row.directive,
        bottleneck: row.bottleneck,
        readiness: row.readiness,
        blocks: blocksData,
        coach_focus: meta.coach_focus || "",
        success_criteria: meta.success_criteria || "",
        recovery_notes: meta.recovery_notes || undefined,
        explanation: meta.explanation || [],
        status: row.status,
        completed_at: row.completed_at || undefined,
        created_at: row.created_at || undefined
    };
}

export function mapMissionToDb(mission: Mission): any {
    return {
        id: mission.id,
        user_id: mission.user_id,
        contract_id: mission.contract_id,
        mission_date: mission.mission_date,
        day_number: mission.day_number,
        title: mission.title,
        directive: mission.directive,
        bottleneck: mission.bottleneck,
        readiness: mission.readiness,
        blocks: {
            blocks: mission.blocks,
            coach_focus: mission.coach_focus,
            success_criteria: mission.success_criteria,
            recovery_notes: mission.recovery_notes || null,
            explanation: mission.explanation
        },
        status: mission.status,
        completed_at: mission.completed_at || null
    };
}

export const coachRepository = {
    // ----------------------------------------------------
    // ATHLETE PROFILE & PERFORMANCE MODEL
    // ----------------------------------------------------
    async fetchProfile(userId: string): Promise<AthleteProfile | null> {
        const cloudUserId = await getAuthenticatedUserId();
        
        if (cloudUserId && cloudUserId === userId) {
            console.log("☁️ Fetching profile and performance model from Supabase for:", userId);
            
            const [profileRes, modelRes] = await Promise.all([
                supabase
                    .from("athlete_profiles")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle(),
                supabase
                    .from("performance_models")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle()
            ]);

            if (profileRes.error) {
                console.error("Failed to fetch athlete profile from cloud:", profileRes.error);
            }

            if (profileRes.data) {
                const pRow = profileRes.data;
                const mRow = modelRes.data;
                const modelData = mRow?.model || {};
                
                const mapped: AthleteProfile = {
                    user_id: pRow.user_id,
                    baselines: {
                        balance: Number(pRow.baselines?.balance || 4.0),
                        landing: Number(pRow.baselines?.landing || 4.0),
                        conditioning: Number(pRow.baselines?.conditioning || 4.0)
                    },
                    constraints_notes: pRow.constraints_notes || undefined,
                    recentFatigueLevel: modelData.recent_fatigue_level || "moderate",
                    previousMissionCompleted: (modelData.total_completed_missions || 0) > 0,
                    totalCompletedMissions: modelData.total_completed_missions || 0,
                    learnedInsights: modelData.insights || []
                };
                
                return mapped;
            }
        }
        
        // Local fallback
        console.log("💾 Fetching profile from LocalStorage");
        const local = localStorage.getItem("goalie_companion_profile");
        return local ? JSON.parse(local) : null;
    },

    async saveProfile(profile: AthleteProfile): Promise<void> {
        const cloudUserId = await getAuthenticatedUserId();
        
        // Always save locally first for reliability
        localStorage.setItem("goalie_companion_profile", JSON.stringify(profile));
        
        if (cloudUserId && cloudUserId === profile.user_id) {
            console.log("☁️ Saving profile and model to Supabase:", profile.user_id);
            
            const profileRow = {
                user_id: profile.user_id,
                baselines: profile.baselines,
                constraints_notes: profile.constraints_notes || null
            };
            
            const modelRow = {
                user_id: profile.user_id,
                model: {
                    balance: profile.baselines.balance,
                    landing: profile.baselines.landing,
                    conditioning: profile.baselines.conditioning,
                    recent_fatigue_level: profile.recentFatigueLevel,
                    total_completed_missions: profile.totalCompletedMissions,
                    insights: profile.learnedInsights
                }
            };

            const [profileRes, modelRes] = await Promise.all([
                supabase.from("athlete_profiles").upsert(profileRow),
                supabase.from("performance_models").upsert(modelRow)
            ]);

            if (profileRes.error) {
                console.error("Failed to save profile to cloud:", profileRes.error);
            }
            if (modelRes.error) {
                console.error("Failed to sync performance model to cloud:", modelRes.error);
            }
        }
    },
    async fetchActiveContract(userId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from("contracts")
            .select("id, name, objective, bottlenecks, status")
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();
        if (error) {
            console.error("Failed to fetch active contract:", error);
        }
        return data || null;
    },

    // ----------------------------------------------------
    // KNOWLEDGE BASES
    // ----------------------------------------------------
    async fetchKnowledgeBase(domain: string, version: string): Promise<any> {
        const cloudUserId = await getAuthenticatedUserId();

        if (cloudUserId) {
            const { data, error } = await supabase
                .from("knowledge_bases")
                .select("data")
                .eq("domain", domain)
                .eq("version", version)
                .maybeSingle();

            if (error) {
                console.error("Failed to fetch Knowledge Base from cloud:", error);
            }

            if (data?.data) {
                return data.data;
            }
        }

        // Seeding database knowledge base for this domain version if unseeded
        if (cloudUserId && domain === "hockey_goalie" && version === "v1.1") {
            try {
                await supabase.from("knowledge_bases").upsert({
                    domain,
                    version,
                    data: GLADIATORS_KNOWLEDGE_BASE
                });
            } catch (e) {
                // Ignore seed failures
            }
        }

        return GLADIATORS_KNOWLEDGE_BASE;
    },

    // ----------------------------------------------------
    // MISSIONS
    // ----------------------------------------------------
    async fetchTodayMission(userId: string, dateString: string): Promise<Mission | null> {
        const cloudUserId = await getAuthenticatedUserId();

        if (cloudUserId && cloudUserId === userId) {
            console.log("☁️ Fetching today's mission from Supabase for date:", dateString);
            const { data: row, error } = await supabase
                .from("missions")
                .select("*")
                .eq("user_id", userId)
                .eq("mission_date", dateString)
                .maybeSingle();

            if (error) {
                console.error("Error fetching mission from cloud:", error);
            }

            if (row) {
                return mapMissionFromDb(row);
            }
        }

        const local = localStorage.getItem("goalie_companion_active_mission");
        if (local) {
            const parsed = JSON.parse(local) as Mission;
            if (parsed.mission_date === dateString) {
                return parsed;
            }
        }
        return null;
    },

    async saveMission(mission: Mission): Promise<void> {
        const cloudUserId = await getAuthenticatedUserId();
        
        // Save locally
        localStorage.setItem("goalie_companion_active_mission", JSON.stringify(mission));

        if (cloudUserId && cloudUserId === mission.user_id) {
            console.log("☁️ Saving mission to Supabase:", mission.id);
            const dbRow = mapMissionToDb(mission);

            const { error } = await supabase
                .from("missions")
                .upsert(dbRow, { onConflict: 'user_id,mission_date' });

            if (error) {
                console.error("Failed to save mission to cloud:", error);
                throw error;
            }
        }
    },

    // ----------------------------------------------------
    // COMPLETED SESSIONS, REFLECTIONS & LEARNING
    // ----------------------------------------------------
    async completeMissionFlow(
        session: Session,
        reflection: Reflection,
        learning: LearningResult
    ): Promise<void> {
        const cloudUserId = await getAuthenticatedUserId();

        // 1. Update localStorage
        localStorage.removeItem("goalie_companion_active_mission");
        localStorage.setItem("goalie_companion_profile", JSON.stringify(learning.updatedProfile));
        localStorage.setItem("goalie_companion_step", JSON.stringify("learning_archive"));

        if (cloudUserId && cloudUserId === session.athlete_id) {
            console.log("☁️ Submitting mission completion flow to Supabase");

            // Complete mission status in DB
            if (session.mission_id) {
                const { error: missionErr } = await supabase
                    .from("missions")
                    .update({ 
                        status: "completed",
                        completed_at: new Date().toISOString()
                    })
                    .eq("id", session.mission_id);
                
                if (missionErr) console.error("Error updating mission status:", missionErr);
            }

            // Save Learning Update to learning_updates
            const { error: learningErr } = await supabase
                .from("learning_updates")
                .insert({
                    user_id: learning.athlete_id,
                    mission_id: session.mission_id,
                    deltas: {
                        reflection: {
                            reflection_id: reflection.reflection_id,
                            energy: reflection.energy,
                            balanceRating: reflection.balanceRating,
                            landingRating: reflection.landingRating,
                            conditioningRating: reflection.conditioningRating,
                            winToday: reflection.winToday || null,
                            bottleneck: reflection.bottleneck || null,
                            tomorrowFocus: reflection.tomorrowFocus || null
                        },
                        deltas: learning.deltas,
                        insights: learning.insights
                    }
                });

            if (learningErr) {
                console.error("Error saving learning update:", learningErr);
                throw learningErr;
            }

            // Save updated Profile & Performance Model
            await this.saveProfile(learning.updatedProfile);
        }
    },

    // ----------------------------------------------------
    // LOCAL TO CLOUD SYNCHRONIZER
    // ----------------------------------------------------
    async syncLocalToCloud(cloudAthleteId: string): Promise<void> {
        console.log("🔄 Running Local-to-Cloud Sync for user:", cloudAthleteId);
        
        try {
            // Get local profile
            const localProfileStr = localStorage.getItem("goalie_companion_profile");
            if (!localProfileStr) return;
            const localProfile = JSON.parse(localProfileStr) as AthleteProfile;

            // Check if profile exists on cloud
            const { data: cloudProfile } = await supabase
                .from("athlete_profiles")
                .select("user_id")
                .eq("user_id", cloudAthleteId)
                .maybeSingle();

            if (!cloudProfile) {
                console.log("☁️ Syncing local profile to cloud...");
                const updatedProfile = { ...localProfile, user_id: cloudAthleteId };
                await this.saveProfile(updatedProfile);
            } else {
                console.log("☁️ Profile already exists on cloud. Merging cloud values to local...");
                const profile = await this.fetchProfile(cloudAthleteId);
                if (profile) {
                    localStorage.setItem("goalie_companion_profile", JSON.stringify(profile));
                }
            }

            // Sync active mission
            const localMissionStr = localStorage.getItem("goalie_companion_active_mission");
            if (localMissionStr) {
                const localMission = JSON.parse(localMissionStr) as Mission;
                const updatedMission = { ...localMission, user_id: cloudAthleteId };
                
                // Save to cloud
                await this.saveMission(updatedMission);
            }
        } catch (e) {
            console.error("Failed to synchronize local and cloud profiles", e);
        }
    }
};
