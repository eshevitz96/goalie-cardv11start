"use client";

// Bone uses the CSS .shimmer class — a gradient sweep like YouTube/Meta skeletons.
// No JS animation, pure CSS for performance.
function Bone({ className = "" }: { className?: string }) {
    return <div className={`shimmer rounded-xl ${className}`} />;
}

export function ScoreWidgetSkeleton() {
    return (
        <div className="glass rounded-[2rem] p-8 border border-border/50 flex flex-col items-center justify-center gap-8">
            {/* Label area */}
            <div className="w-full flex flex-col items-start gap-1.5">
                <Bone className="h-2.5 w-14" />
                <Bone className="h-3 w-28" />
            </div>

            {/* Ring */}
            <div className="relative w-32 h-32">
                <div className="w-full h-full rounded-full border-[8px] border-muted/30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Bone className="h-10 w-14 rounded-lg" />
                    <Bone className="h-2 w-8" />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 w-full border-t border-border/50 pt-6">
                {[0, 1, 2].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Bone className="h-5 w-10" />
                        <Bone className="h-2 w-14" />
                    </div>
                ))}
            </div>

            {/* Bottom action bar */}
            <Bone className="w-full h-9 rounded-xl" />
        </div>
    );
}

export function ProtocolCardSkeleton() {
    return (
        <div className="w-full py-10 space-y-10">
            <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(i => <Bone key={i} className="w-8 h-4" />)}
            </div>
            <div className="space-y-3">
                <Bone className="h-14 w-3/4 rounded-2xl" />
                <Bone className="h-3 w-48" />
            </div>
            <Bone className="h-10 w-full rounded-2xl" />
            <div className="h-px bg-border" />
            <div className="flex gap-24">
                <div className="space-y-3">
                    <Bone className="h-2.5 w-24" />
                    <div className="flex gap-4">
                        {[0, 1, 2].map(i => <Bone key={i} className="h-4 w-14" />)}
                    </div>
                </div>
                <div className="space-y-3">
                    <Bone className="h-2.5 w-16" />
                    <Bone className="h-4 w-12" />
                </div>
            </div>
        </div>
    );
}

export function StatRowSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50">
            <Bone className="h-3 w-24" />
            <Bone className="h-4 w-10" />
        </div>
    );
}
