"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    ArrowRight, 
    Home, 
    ShieldCheck, 
    CreditCard, 
    User, 
    Mail, 
    Phone,
    Calendar,
    ChevronDown,
    Loader2,
    FileText,
    Receipt,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getSubmissionById, getReceiptUrl } from "../actions";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";

export default function PrivateTrainingSuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-primary opacity-50" size={40} />
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .meta { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .meta div b { display: block; font-size: 10px; text-transform: uppercase; color: #666; }
        .section { margin-bottom: 40px; }
        .section h2 { border-left: 4px solid #000; padding-left: 15px; font-size: 18px; text-transform: uppercase; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; }
        .signature { margin-top: 40px; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; }
        .signature-font { font-family: 'Brush Script MT', cursive, serif; font-size: 32px; color: #000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>The Goalie Brand</h1>
        <p>Official Enrollment & Liability Packet</p>
    </div>

    <div class="meta">
        <div><b>Athlete</b>${submission?.athlete_name || 'N/A'}</div>
        <div><b>Date Signed</b>${new Date(submission?.created_at).toLocaleDateString()}</div>
        <div><b>Verification</b>DIGITAL_SIGNATURE_VERIFIED</div>
        <div><b>Contact</b>${submission?.email}</div>
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
        <p><b>E-Signature</b></p>
        <span class="signature-font">${submission?.athlete_name || 'Athlete'}</span>
        <p style="font-size: 10px; color: #999;">Signed via The Goalie Brand Portal | IP Logged & Verified</p>
    </div>

    <div class="footer">
        © 2026 THE GOALIE BRAND | PROTECTED LEGAL DOCUMENT
    </div>
</body>
</html>`;

        const blob = new Blob([waiverHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TGB_Waiver_${submission?.athlete_name?.replace(/ /g, '_') || 'Training'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadReceipt = async () => {
        if (!sessionId) return;
        const result = await getReceiptUrl(sessionId);
        if (result.receiptUrl) {
            window.open(result.receiptUrl, '_blank');
        } else {
            alert(result.error || "Receipt still processing. Please check your email.");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-primary opacity-50" size={40} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground/60">Confirming Enrollment...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects - Clean/Minimal */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="text-center mb-8 flex flex-col items-center">
                    <BrandLogo
                        size={40}
                        textClassName="text-3xl md:text-4xl font-medium tracking-tight mb-2"
                    />
                    <div className="flex items-center gap-2 text-emerald-500 text-sm uppercase tracking-[0.2em] font-black">
                        <CheckCircle2 size={12} className="opacity-80" />
                        Enrollment Complete
                    </div>
                </div>

                <div className="bg-card/20 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden ring-1 ring-white/10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">You’re in.</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                Your access has been confirmed. A receipt has been sent to your email. Next steps for scheduling will follow directly.
                            </p>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-secondary/40 border border-border/50 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                            
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Athlete</p>
                                    <h4 className="text-lg font-bold">{submission?.athlete_name || 'Confirmed Athlete'}</h4>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border/30">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                        <ShieldCheck size={10} /> Waiver
                                    </div>
                                    <p className="text-xs font-bold text-emerald-500">Confirmed</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                        <CreditCard size={10} /> Payment
                                    </div>
                                    <p className="text-xs font-bold text-emerald-500">Authorized</p>
                                </div>
                            </div>

                            <div className="space-y-1 pt-4 border-t border-border/30">
                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                    <Mail size={10} /> Contact Email
                                </div>
                                <p className="text-xs font-bold truncate">{submission?.email || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Downloads Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={handleDownloadReceipt}
                                className="group flex flex-col items-center justify-center gap-3 p-6 bg-secondary/20 hover:bg-secondary/40 border border-border/40 rounded-3xl transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Receipt size={18} />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/80">Get Receipt</span>
                            </button>
                            <button 
                                onClick={handleDownloadWaiver}
                                className="group flex flex-col items-center justify-center gap-3 p-6 bg-secondary/20 hover:bg-secondary/40 border border-border/40 rounded-3xl transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <FileText size={18} />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/80">Save Waiver</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="w-full py-6 rounded-2xl group border-border/40 hover:bg-secondary/50 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
                            >
                                <Home size={14} className="mr-2 opacity-50" /> Return Home
                            </Button>
                        </div>
                    </motion.div>
                </div>
                
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">
                    The Goalie Brand © 2026 • Welcome to the Team
                </p>
            </div>
        </main>
    );
}
