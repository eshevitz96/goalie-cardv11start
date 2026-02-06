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
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[50vh] p-6">
                    <Card className="max-w-md w-full bg-red-500/10 border-red-500/20">
                        <CardContent className="p-6 text-center space-y-4">
                            <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
                            <p className="text-sm text-muted-foreground">
                                {this.state.error?.message || "An unexpected error occurred."}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => this.setState({ hasError: false })}
                                className="w-full"
                            >
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
