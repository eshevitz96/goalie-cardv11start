'use client';

import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

interface RavenGameProps {
    userId: string | null;
    personalBest: number | null;
    onNewPb: (newScore: number) => void;
}

interface SessionMetrics {
    score: number;
    consistency: number;
    peakStreak: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

export default function RavenGame({ userId, personalBest, onNewPb }: RavenGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
    const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({ score: 0, consistency: 0, peakStreak: 0 });
    const [isNewPb, setIsNewPb] = useState(false);

    // Refs for fast, lag-free gameplay loop access
    const gameStateRef = useRef<'idle' | 'playing' | 'dead'>('idle');
    const markerYRef = useRef(250);
    const markerVelocityRef = useRef(0);
    const gatesRef = useRef<Array<{ x: number; gapCenter: number; passed: boolean }>>([]);
    const scoreRef = useRef(0);
    
    // Telemetry storage refs
    const passedOffsetsRef = useRef<number[]>([]);
    const currentStreakRef = useRef(0);
    const peakStreakRef = useRef(0);

    // Handle clicks/touches on canvas or immediate wrapper only
    const triggerJump = () => {
        if (gameStateRef.current === 'idle') {
            startGame();
        } else if (gameStateRef.current === 'playing') {
            markerVelocityRef.current = -6.2; // apply upward impulse
        }
    };

    const startGame = () => {
        // Reset gameplay values
        markerYRef.current = 250;
        markerVelocityRef.current = 0;
        gatesRef.current = [];
        scoreRef.current = 0;
        
        passedOffsetsRef.current = [];
        currentStreakRef.current = 0;
        peakStreakRef.current = 0;
        
        setIsNewPb(false);
        gameStateRef.current = 'playing';
        setGameState('playing');
    };

    const endSession = async () => {
        gameStateRef.current = 'dead';
        setGameState('dead');

        const finalScore = scoreRef.current;

        // Calculate Consistency % (standard deviation of offsets relative to gap center)
        let finalConsistency = 0;
        const offsets = passedOffsetsRef.current;
        if (offsets.length === 1) {
            finalConsistency = 100;
        } else if (offsets.length >= 2) {
            const mean = offsets.reduce((sum, val) => sum + val, 0) / offsets.length;
            const variance = offsets.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / offsets.length;
            const stdDev = Math.sqrt(variance);
            
            // Max allowed offset before collision is half the gap minus marker radius:
            // (152 / 2) - 12 = 64px
            const maxDev = 64; 
            finalConsistency = Math.max(0, Math.min(100, Math.round(100 * (1 - stdDev / maxDev))));
        }

        const metrics = {
            score: finalScore,
            consistency: finalConsistency,
            peakStreak: peakStreakRef.current
        };
        setSessionMetrics(metrics);

        // Check if personal best was beaten
        const isPb = personalBest === null || finalScore > personalBest;
        if (isPb) {
            setIsNewPb(true);
            onNewPb(finalScore);
        }

        // Persist score to DB (game_type = 'training')
        if (userId === '00000000-0000-0000-0000-000000000000') {
            // Dev bypass mode
            if (isPb) {
                localStorage.setItem('dev_training_pb', finalScore.toString());
            }
        } else if (userId) {
            try {
                await supabase
                    .from('training_game_scores')
                    .insert({
                        user_id: userId,
                        game_type: 'training',
                        score: finalScore
                    });
            } catch (err) {
                console.error('Error persisting training score:', err);
            }
        }
    };

    // Global keyboard Space trigger
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable if focusing typing inputs
            if (
                document.activeElement?.tagName === 'INPUT' || 
                document.activeElement?.tagName === 'TEXTAREA'
            ) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault(); // Stop page scrolling
                triggerJump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [personalBest, userId]);

    // Canvas resize handling
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Canvas render & update loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const updateGame = () => {
            if (gameStateRef.current !== 'playing') return;

            // Apply gravity
            markerVelocityRef.current += 0.38;
            if (markerVelocityRef.current > 8) markerVelocityRef.current = 8; // Terminal falling velocity
            markerYRef.current += markerVelocityRef.current;

            // Floor/ceiling collision
            const radius = 12;
            if (markerYRef.current - radius <= 0 || markerYRef.current + radius >= CANVAS_HEIGHT) {
                endSession();
                return;
            }

            // Calculate scrolling speed with soft load acceleration
            const speed = 2.4 + (scoreRef.current * 0.12);
            const currentSpeed = Math.min(speed, 7.5);

            const gates = gatesRef.current;
            let collided = false;

            // Decide whether to spawn a new gate
            let spawnNew = false;
            if (gates.length === 0) {
                spawnNew = true;
            } else {
                const lastGate = gates[gates.length - 1];
                if (CANVAS_WIDTH - lastGate.x >= 260) {
                    spawnNew = true;
                }
            }

            if (spawnNew) {
                const gapHeight = 152;
                const padding = 40;
                const gapCenter = padding + gapHeight / 2 + Math.random() * (CANVAS_HEIGHT - 2 * padding - gapHeight);
                gates.push({
                    x: CANVAS_WIDTH,
                    gapCenter,
                    passed: false
                });
            }

            const gateWidth = 52;
            const gapHeight = 152;
            const markerX = 80;

            gatesRef.current = gates.filter(gate => {
                gate.x -= currentSpeed;

                const halfGap = gapHeight / 2;
                const gapTop = gate.gapCenter - halfGap;
                const gapBottom = gate.gapCenter + gapHeight / 2;

                // Horizontal boundary overlap
                if (markerX + radius >= gate.x && markerX - radius <= gate.x + gateWidth) {
                    // Vertical gate overlap check
                    if (markerYRef.current - radius <= gapTop || markerYRef.current + radius >= gapBottom) {
                        collided = true;
                    }
                }

                // Successful pass detection
                if (!gate.passed && gate.x + gateWidth < markerX - radius) {
                    gate.passed = true;
                    scoreRef.current += 1;

                    // Telemetry calculation
                    const offset = markerYRef.current - gate.gapCenter;
                    passedOffsetsRef.current.push(offset);

                    // Near-miss check: outer 20% of gap height (152 * 0.4 = 60.8px offset)
                    const isNearMiss = Math.abs(offset) >= 60.8;
                    if (isNearMiss) {
                        currentStreakRef.current = 0;
                    } else {
                        currentStreakRef.current += 1;
                        if (currentStreakRef.current > peakStreakRef.current) {
                            peakStreakRef.current = currentStreakRef.current;
                        }
                    }
                }

                return gate.x + gateWidth > 0; // Filter out off-screen gates
            });

            if (collided) {
                endSession();
            }
        };

        const drawGame = () => {
            // Reset transform to identity
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // Dynamically scale context to map virtual (400x500) coordinate space onto physical device pixels
            const scaleX = (rect.width * dpr) / CANVAS_WIDTH;
            const scaleY = (rect.height * dpr) / CANVAS_HEIGHT;
            ctx.scale(scaleX, scaleY);

            // Draw background
            ctx.fillStyle = '#09090B';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const state = gameStateRef.current;

            if (state === 'playing' || state === 'dead') {
                const radius = 12;
                const gateWidth = 52;
                const gapHeight = 152;

                // Draw gates
                gatesRef.current.forEach(gate => {
                    const gapTop = gate.gapCenter - gapHeight / 2;
                    const gapBottom = gate.gapCenter + gapHeight / 2;

                    // Top block
                    ctx.fillStyle = '#1C1C1E';
                    ctx.fillRect(gate.x, 0, gateWidth, gapTop);

                    // Top block border
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(gate.x - 0.5, -1, gateWidth + 1, gapTop + 1);

                    // Elite Emerald left edge accent
                    ctx.strokeStyle = 'rgba(0,103,71,0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(gate.x, 0);
                    ctx.lineTo(gate.x, gapTop);
                    ctx.stroke();

                    // Bottom block
                    ctx.fillStyle = '#1C1C1E';
                    ctx.fillRect(gate.x, gapBottom, gateWidth, CANVAS_HEIGHT - gapBottom);

                    // Bottom block border
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(gate.x - 0.5, gapBottom, gateWidth + 1, CANVAS_HEIGHT - gapBottom + 1);

                    // Bottom block accent
                    ctx.strokeStyle = 'rgba(0,103,71,0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(gate.x, gapBottom);
                    ctx.lineTo(gate.x, CANVAS_HEIGHT);
                    ctx.stroke();
                });

                // Draw marker
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(80, markerYRef.current, radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw live score counter
                if (state === 'playing') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '14px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(scoreRef.current.toString(), CANVAS_WIDTH / 2, 36);
                }
            } else if (state === 'idle') {
                // Floating vertical marker oscillation
                const radius = 12;
                const time = Date.now() * 0.003;
                const oscY = 250 + Math.sin(time) * 15;
                markerYRef.current = oscY;

                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(80, oscY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const loop = () => {
            updateGame();
            drawGame();
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [personalBest, userId]);

    return (
        <div 
            ref={containerRef}
            onClick={triggerJump}
            onTouchStart={(e) => {
                e.preventDefault(); // Stop click emulation lag on touch
                triggerJump();
            }}
            className="relative w-full max-w-[480px] aspect-[4/5] bg-[#09090B] border border-white/10 rounded-[32px] overflow-hidden focus:outline-none select-none cursor-pointer shadow-2xl"
            style={{ aspectRatio: '4/5' }}
            tabIndex={0}
        >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: '100%', height: '100%' }} />

            {/* Start Screen Overlay - Cleaned of Game Titles */}
            {gameState === 'idle' && (
                <div className="absolute inset-0 bg-[#09090B]/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                    <p className="m-0 text-[11px] font-black tracking-widest text-white/60 uppercase mt-12 animate-pulse">
                        Tap or Space to begin
                    </p>
                    
                    <p className="m-0 text-[10px] text-white/40 mt-2 font-medium tracking-wide">
                        Fly through the gaps. Don't hit the walls.
                    </p>
                    
                    {personalBest !== null && (
                        <p className="absolute bottom-8 m-0 text-[10px] font-mono tracking-wider text-white/30 uppercase">
                            Personal Best: {personalBest}
                        </p>
                    )}
                </div>
            )}

            {/* Session End Screen Telemetry Overlay (Simplified) */}
            {gameState === 'dead' && (
                <div className="absolute inset-0 bg-[#09090B]/95 flex flex-col items-center justify-between p-10 select-none">
                    {/* Empty spacer to align center */}
                    <div />

                    {/* F1 Telemetry Readouts - Simplified to Reactions and Personal Best */}
                    <div className="w-full max-w-[260px] flex flex-col gap-4 font-mono">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">Reactions</span>
                            <span className="text-2xl font-bold text-white leading-none">{sessionMetrics.score}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">Personal Best</span>
                            <span className="text-2xl font-bold text-white leading-none">
                                {personalBest !== null ? Math.max(personalBest, sessionMetrics.score) : sessionMetrics.score}
                            </span>
                        </div>
                        
                        {/* New PB banner */}
                        {isNewPb && (
                            <div className="flex justify-center pt-2">
                                <span className="text-[10px] font-bold tracking-widest text-[#006747] uppercase">
                                    New PB
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom controls and seed string */}
                    <div className="w-full flex flex-col items-center gap-6">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Avoid triggering standard click jump
                                startGame();
                            }}
                            className="w-full max-w-[260px] py-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white border border-white/10 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center"
                        >
                            Run Again
                        </button>
                        <p className="m-0 text-[10px] font-mono tracking-wider text-white/20 uppercase">
                            Session data logged.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
