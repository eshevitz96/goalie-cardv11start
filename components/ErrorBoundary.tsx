"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        
        // Auto-recover from stale chunks after a new deployment
        const isChunkError = 
            error?.message?.toLowerCase().includes("loading chunk") ||
            error?.name === "ChunkLoadError" ||
            error?.message?.toLowerCase().includes("failed to fetch dynamically imported module");

        if (isChunkError && typeof window !== "undefined") {
            const reloadKey = `chunk_reload_${window.location.pathname}`;
            const lastReload = sessionStorage.getItem(reloadKey);
            const now = Date.now();
            
            // Only auto-reload if we haven't reloaded in the last 15 seconds
            if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
                sessionStorage.setItem(reloadKey, now.toString());
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isChunkError = 
                this.state.error?.message?.toLowerCase().includes("loading chunk") ||
                this.state.error?.name === "ChunkLoadError";

            return (
                <div className="flex items-center justify-center min-h-[50vh] p-6">
                    <Card className="max-w-md w-full bg-red-500/10 border-red-500/20">
                        <CardContent className="p-6 text-center space-y-4">
                            <h2 className="text-xl font-bold text-red-500">
                                {isChunkError ? "App Updated" : "Something went wrong"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isChunkError 
                                    ? "A new version of Goalie Card was just deployed. Tap below to load the latest update."
                                    : (this.state.error?.message || "An unexpected error occurred.")}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.location.reload();
                                    } else {
                                        this.setState({ hasError: false });
                                    }
                                }}
                                className="w-full font-semibold"
                            >
                                {isChunkError ? "Refresh Page" : "Try Again"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
