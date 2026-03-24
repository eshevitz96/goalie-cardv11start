"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { ProfileDashboard } from "@/components/goalie/profile/ProfileDashboard";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";

interface ProfileContentProps {
    goalie: {
        id: string;
        name: string;
        email: string;
        team: string | null;
        catch_hand: string | null;
        height: string | null;
        weight: string | null;
        grad_year: number | null;
        sport: string | null;
        team_history: { team: string, years: string }[] | null;
    }
}

export default function ProfileContent({ goalie }: ProfileContentProps) {
    const toast = useToast();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleDeactivate = async () => {
        if (!confirm("Are you sure you want to deactivate your card?\n\nThis will remove your roster spot linkage and sign you out.")) return;

        const confirmText = prompt("To confirm, type 'DEACTIVATE' below:");
        if (confirmText === 'DEACTIVATE') {
            setIsProcessing(true);
            try {
                const { deleteAccount } = await import("@/app/actions");
                const result = await deleteAccount();

                if (!result.success) {
                    throw new Error(result.error);
                }

                toast.success("Account deactivated successfully.");
                window.location.href = '/login';

            } catch (err: any) {
                toast.error("Deactivation Failed: " + err.message);
                setIsProcessing(false);
            }
        }
    };

    const handleSave = async (formData: any) => {
        setIsSaving(true);

        try {
            const result = await updateProfile(goalie.id, {
                goalie_name: formData.name,
                email: formData.email,
                grad_year: parseInt(formData.grad_year) || null,
                team: formData.team,
                height: formData.height,
                weight: formData.weight,
                catch_hand: formData.catch_hand,
                sport: formData.sport,
                team_history: formData.team_history
            });

            if (!result.success) {
                toast.error("Failed to save: " + result.error);
            } else {
                toast.success("Profile updated successfully!");

                // Update local state immediately to reflect changes
                goalie.name = formData.name;
                goalie.team = formData.team;
                goalie.grad_year = parseInt(formData.grad_year) || null;
                goalie.height = formData.height;
                goalie.weight = formData.weight;
                goalie.catch_hand = formData.catch_hand;
                goalie.sport = formData.sport;
                goalie.team_history = formData.team_history;

                router.refresh();
            }
        } catch (err: any) {
            toast.error("Save failed: " + err.message);
        }
        setIsSaving(false);
    };

    return (
        <ProfileDashboard
            goalie={goalie}
            onSave={handleSave}
            onDeactivate={handleDeactivate}
            isSaving={isSaving}
            isProcessing={isProcessing}
        />
    );
}
