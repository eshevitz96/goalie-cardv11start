import React from 'react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/context/ToastContext';

interface HighlightsSectionProps {
    rosterId: string;
}

export function HighlightsSection({ rosterId }: HighlightsSectionProps) {
    const toast = useToast();

    const handleAddVideo = () => {
        const url = prompt("Enter Video URL (YouTube/Insta):");
        if (url) {
            supabase.from('highlights').insert({
                roster_id: rosterId,
                url: url,
                description: "Parent Upload"
            }).then(({ error }) => {
                if (error) toast.error("Error: " + error.message);
                else toast.success("Highlight Added!");
            });
        }
    };

    return (
        <div className="glass rounded-3xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary">★</span> Highlights
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddVideo}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-colors h-auto"
                >
                    + Add Video
                </Button>
            </div>
            <div className="text-center text-muted-foreground text-xs py-4">
                Share game clips for coach review.
            </div>
        </div>
    );
}
