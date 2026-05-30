"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Reflections } from "@/components/Reflections";
import { PostGameReport } from "@/components/PostGameReport";

interface ReflectionSectionProps {
    rosterId: string;
    feedback: any;
    journalPrefill: string | null;
    expandedBlock: 'journal' | 'notes' | null;
    onExpandedBlockChange: (block: 'journal' | 'notes' | null) => void;
}

export function ReflectionSection({ rosterId, feedback, journalPrefill, expandedBlock, onExpandedBlockChange }: ReflectionSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
                {expandedBlock !== 'notes' && (
                    <motion.div
                        layout
                        className={`${expandedBlock === 'journal' ? 'md:col-span-2' : 'md:col-span-1'} transition-all duration-500 ease-spring`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        <Reflections
                            rosterId={rosterId}
                            isExpanded={expandedBlock === 'journal'}
                            onToggleExpand={() => onExpandedBlockChange(expandedBlock === 'journal' ? null : 'journal')}
                            prefill={journalPrefill}
                        />
                    </motion.div>
                )}

                {expandedBlock !== 'journal' && (
                    <motion.div
                        layout
                        className={`${expandedBlock === 'notes' ? 'md:col-span-2' : 'md:col-span-1'} transition-all duration-500 ease-spring`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        <PostGameReport
                            report={feedback}
                            isExpanded={expandedBlock === 'notes'}
                            onToggleExpand={() => onExpandedBlockChange(expandedBlock === 'notes' ? null : 'notes')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
