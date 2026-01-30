'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCoachProfile(formData: FormData) {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    const fullName = formData.get("fullName") as string;
    const title = formData.get("title") as string;
    const bio = formData.get("bio") as string;
    const calendarSync = formData.get("calendarSync") === "on"; // Checkbox/Switch handling

    const settings = {
        calendar_sync: calendarSync
    };

    const updateData: any = {
        title,
        bio,
        settings,
        updated_at: new Date().toISOString()
    };

    // Only update full_name if provided (some flows might use goalie_name)
    if (fullName) {
        updateData.full_name = fullName;
        updateData.goalie_name = fullName; // Sync both for consistency
    }

    const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

    if (error) {
        console.error("Profile Update Error Details:", error);
        return { error: `Failed to update profile: ${error.message}` };
    }

    revalidatePath("/coach/profile");
    revalidatePath("/coach"); // Update dashboard header name if changed

    return { success: true };
}
