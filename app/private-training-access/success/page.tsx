"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    ArrowRight, 
    User, 
    Calendar,
    Loader2,
    FileText,
    Receipt
} from "lucide-react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getSubmissionById, getReceiptUrl } from "../actions";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";

export default function PrivateTrainingSuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-zinc-400 opacity-60" size={40} />
            </main>
        }>
            <PrivateTrainingSuccessContent />
        </Suspense>
    );
}

function PrivateTrainingSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const submissionId = searchParams.get('submission_id');
    const sessionId = searchParams.get('session_id');
    
    const [submission, setSubmission] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (submissionId) {
                const data = await getSubmissionById(submissionId);
                setSubmission(data);
            }
            setIsLoading(false);
        };
        fetchSubmission();
    }, [submissionId]);

    const handleDownloadWaiver = () => {
        const waiverHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>THE GOALIE BRAND - Signed Training Waiver</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 24px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .meta div b { display: block; font-size: 10px; text-transform: uppercase; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { border-left: 3px solid #000; padding-left: 12px; font-size: 16px; text-transform: uppercase; margin-bottom: 10px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
        .signature { margin-top: 30px; padding: 20px; border: 1px dashed #999; border-radius: 8px; }
        .signature-font { font-family: 'Georgia', serif; font-style: italic; font-size: 26px; color: #000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>The Goalie Brand</h1>
        <p>Private Training Agreement & Release</p>
    </div>

    <div class="meta">
        <div><b>Athlete</b>${submission?.athlete_name || 'N/A'}</div>
        <div><b>Date Signed</b>${new Date(submission?.created_at || Date.now()).toLocaleDateString()}</div>
        <div><b>Verification</b>DIGITAL_SIGNATURE_VERIFIED</div>
        <div><b>Contact</b>${submission?.email || 'N/A'}</div>
    </div>

    <div class="section">
        <h2>1. Main Liability Release</h2>
        <p>${PRIVATE_ACCESS_CONFIG.trainingTerms.mainWaiver.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="section">
        <h2>2. Payment & Refund Policy</h2>
        <p>${PRIVATE_ACCESS_CONFIG.trainingTerms.paymentPolicy.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="section">
        <h2>3. Athlete Code of Conduct</h2>
        <p>${PRIVATE_ACCESS_CONFIG.trainingTerms.codeOfConduct.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="section">
        <h2>4. Extended Waiver of Liability</h2>
        <p>${PRIVATE_ACCESS_CONFIG.trainingTerms.liabilityWaiver.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="signature">
        <p style="font-size: 11px; text-transform: uppercase; color: #666; margin: 0 0 5px 0;"><b>Digital Signature</b></p>
        <span class="signature-font">${submission?.digital_signature || submission?.athlete_name || 'Athlete'}</span>
        <p style="font-size: 10px; color: #999; margin-top: 5px;">Signed via The Goalie Brand Portal | Verified</p>
    </div>

    <div class="footer">
        © 2026 THE GOALIE BRAND • OFFICIAL PRIVATE ENROLLMENT
    </div>
</body>
</html>`;

        const blob = new Blob([waiverHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GoalieCard_Waiver_${submission?.athlete_name?.replace(/ /g, '_') || 'Training'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadReceipt = async () => {
        if (!sessionId) return;
        const result = await getReceiptUrl(sessionId);
        if (result.receiptUrl) {
            window.open(result.receiptUrl, '_blank');
        } else {
            alert(result.error || "Receipt still processing. A copy has been emailed to you.");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-zinc-400 opacity-60" size={40} />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Confirming Enrollment...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Subtle Top Accent */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="text-center mb-8 flex flex-col items-center">
                    <BrandLogo
                        size={40}
                        variant="light"
                        textClassName="text-3xl md:text-4xl font-medium tracking-tight mb-2 text-white"
                    />
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-[0.2em] font-semibold">
                        <CheckCircle2 size={12} className="opacity-80 text-zinc-400" />
                        Enrollment Complete
                    </div>
                </div>

                <div className="bg-[#121215]/90 backdrop-blur-2xl border border-zinc-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        {/* Goalie-First Welcome Copy */}
                        <div className="space-y-3 text-center">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">You&apos;re in.</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                                Your Goalie Card is already set up. It&apos;s where your lessons, training, and film live. Take a quick tour to see your week.
                            </p>
                        </div>

                        {/* Summary Details Box */}
                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                                    <User size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-0.5">Athlete</p>
                                    <h4 className="text-base font-bold text-white truncate">{submission?.athlete_name || 'Confirmed Athlete'}</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                        Confirmed
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80 text-xs">
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Contact</p>
                                    <p className="text-zinc-300 font-medium truncate mt-0.5">{submission?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Training Status</p>
                                    <p className="text-white font-semibold mt-0.5">Active Client</p>
                                </div>
                            </div>
                        </div>

                        {/* Document Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleDownloadReceipt}
                                className="group flex items-center justify-center gap-2 p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all"
                            >
                                <Receipt size={14} className="text-zinc-400 group-hover:text-white" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 group-hover:text-white">Get Receipt</span>
                            </button>
                            <button 
                                onClick={handleDownloadWaiver}
                                className="group flex items-center justify-center gap-2 p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all"
                            >
                                <FileText size={14} className="text-zinc-400 group-hover:text-white" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 group-hover:text-white">Save Waiver</span>
                            </button>
                        </div>

                        {/* Primary CTA */}
                        <div className="pt-2">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-4 text-sm font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md group"
                            >
                                Open My Goalie Card <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>
                
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
                    The Goalie Brand © 2026 • Welcome to the Team
                </p>
            </div>
        </main>
    );
}
