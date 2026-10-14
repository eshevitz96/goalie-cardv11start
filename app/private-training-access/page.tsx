"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Loader2, 
    ArrowRight, 
    AlertCircle, 
    ShieldCheck, 
    Lock, 
    User, 
    Mail, 
    Phone, 
    Users,
    CheckCircle2,
    X,
    FileText,
    Receipt,
    ChevronRight,
    ArrowLeft,
    Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { 
    validateAccessCode, 
    createPrivateSubmission, 
    updateWaiverStatus, 
    createEmbeddedCheckoutSession,
    resumeSubmission
} from "./actions";
import { 
    PRIVATE_ACCESS_CONFIG, 
    AccessPath, 
    PlanDisplay 
} from "@/constants/privateAccess";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type FlowStep = 'access-code' | 'info' | 'waiver' | 'plan-selection' | 'payment-confirm';

export default function PrivateTrainingAccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-zinc-400 opacity-60" size={40} />
            </main>
        }>
            <PrivateTrainingAccessContent />
        </Suspense>
    );
}

function PrivateTrainingAccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // UI State
    const [step, setStep] = useState<FlowStep>('access-code');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Data State
    const [accessCode, setAccessCode] = useState("");
    const [accessPath, setAccessPath] = useState<AccessPath | null>(null);
    const [availablePlans, setAvailablePlans] = useState<PlanDisplay[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [athleteName, setAthleteName] = useState("");
    const [parentName, setParentName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [sport, setSport] = useState<string>("Lacrosse");
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    
    // Waiver State
    const [waiverChecks, setWaiverChecks] = useState({
        main: false,
        payment: false,
        code: false,
        liability: false
    });
    const [viewingWaiver, setViewingWaiver] = useState<string | null>(null);
    const [signature, setSignature] = useState("");
    const [signatureDate, setSignatureDate] = useState(new Date().toLocaleDateString());
    
    // Payment State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    
    // Mode State
    const [isTestMode, setIsTestMode] = useState(PRIVATE_ACCESS_CONFIG.stripe.isTestMode);

    // Initial check for submission ID from URL or sessionStorage (resuming pending submission)
    useEffect(() => {
        const id = searchParams.get('submission_id') || (typeof window !== 'undefined' ? sessionStorage.getItem('tgb_private_submission_id') : null);
        if (id) {
            setSubmissionId(id);
            resumeSubmission(id).then(res => {
                if (res.success && res.submission) {
                    setAccessCode(res.submission.accessCode);
                    setAthleteName(res.submission.athleteName);
                    setParentName(res.submission.parentName);
                    setEmail(res.submission.email);
                    setPhone(res.submission.phone);
                    if (res.submission.digitalSignature) {
                        setSignature(res.submission.digitalSignature);
                        setWaiverChecks({ main: true, payment: true, code: true, liability: true });
                    }
                    if (res.path && res.plans && res.plans.length > 0) {
                        setAccessPath(res.path);
                        setAvailablePlans(res.plans);
                        const defaultPlan = res.plans.find((p: any) => p.isDefault) || res.plans[0];
                        setSelectedPlan(defaultPlan.id);
                    }
                    setStep(res.step);
                }
            });
        }
    }, [searchParams]);

    // Handlers
    const handleAccessCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await validateAccessCode(accessCode);
            if (res.isValid && res.path && res.plans.length > 0) {
                setAccessPath(res.path);
                setAvailablePlans(res.plans);
                const defaultPlan = res.plans.find((p: any) => p.isDefault) || res.plans[0];
                setSelectedPlan(defaultPlan.id);
                setStep('info');
            } else {
                setError("Invalid access code. Please check your invitation.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await createPrivateSubmission({
                athleteName,
                parentName,
                email,
                phone,
                accessCode,
                sport,
                submissionId: submissionId || undefined
            });
            
            if ('error' in res && res.error) {
                setError(res.error);
                return;
            }
            
            const { submissionId: id, path, plans } = res as any;
            setSubmissionId(id);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('tgb_private_submission_id', id);
            }
            if (path && plans && plans.length > 0) {
                setAccessPath(path);
                setAvailablePlans(plans);
                if (!selectedPlan || !plans.some((p: any) => p.id === selectedPlan)) {
                    const defaultPlan = plans.find((p: any) => p.isDefault) || plans[0];
                    setSelectedPlan(defaultPlan.id);
                }
            }
            // Go straight to waivers
            setStep('waiver');
        } catch (err: any) {
            setError(err.message || "Failed to save information.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWaiverSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allChecked = Object.values(waiverChecks).every(v => v);
        if (!allChecked || !signature) {
            setError("Please accept all waivers and provide your digital signature.");
            return;
        }
        
        setError(null);
        setIsLoading(true);
        
        try {
            const res = await updateWaiverStatus(submissionId!, true, signature);
            if (res.error) {
                setError(res.error);
                setIsLoading(false);
                return;
            }

            setStep('plan-selection');
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleDownloadWaiver = (waiverId: string) => {
        const waiverLabel = {
            main: 'Main Liability Release',
            payment: 'Payment & Refund Policy',
            code: 'Athlete Code of Conduct',
            liability: 'Extended Waiver of Liability'
        }[waiverId] || 'Waiver';
        
        const keyMap: Record<string, string> = {
            main: 'mainWaiver',
            payment: 'paymentPolicy',
            code: 'codeOfConduct',
            liability: 'liabilityWaiver'
        };
        const waiverText = (PRIVATE_ACCESS_CONFIG.trainingTerms as any)[keyMap[waiverId]] || '';
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        iframe.style.border = 'none';
        iframe.setAttribute('title', 'Print Frame');
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>${waiverLabel} - Goalie Card</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            color: #111;
                            line-height: 1.6;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header {
                            border-bottom: 2px solid #eaeaea;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .title {
                            font-size: 24px;
                            font-weight: 700;
                            margin: 0 0 10px 0;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .subtitle {
                            font-size: 14px;
                            color: #666;
                            margin: 0;
                        }
                        .content {
                            font-size: 15px;
                            white-space: pre-wrap;
                            margin-bottom: 40px;
                            color: #333;
                        }
                        .signature-section {
                            border-top: 2px solid #eaeaea;
                            padding-top: 30px;
                            margin-top: 50px;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 40px;
                        }
                        .sig-box {
                            border-bottom: 1px solid #999;
                            padding-bottom: 10px;
                        }
                        .sig-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            color: #666;
                            margin-top: 5px;
                            font-weight: bold;
                        }
                        .sig-value {
                            font-family: "Georgia", serif;
                            font-style: italic;
                            font-size: 20px;
                            color: #111;
                            padding-left: 10px;
                        }
                        @media print {
                            body { padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="title">${waiverLabel}</h1>
                        <p class="subtitle">Goalie Card - Private Training Agreement</p>
                    </div>
                    <div class="content">${waiverText}</div>
                    <div class="signature-section">
                        <div class="sig-box">
                            <div class="sig-value">${signature || '___________________________'}</div>
                            <div class="sig-label">Digital Signature</div>
                        </div>
                        <div class="sig-box">
                            <div class="sig-value" style="font-family: inherit; font-style: normal; font-size: 16px;">${signatureDate}</div>
                            <div class="sig-label">Date signed</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        doc.close();
        
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                const cleanUp = () => {
                    iframe.contentWindow?.removeEventListener('afterprint', cleanUp);
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    }, 1000);
                };
                iframe.contentWindow.addEventListener('afterprint', cleanUp);
                iframe.contentWindow.print();
                setTimeout(() => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                }, 60000);
            }
        }, 500);
    };

    const handleDownloadAllWaivers = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        iframe.style.border = 'none';
        iframe.setAttribute('title', 'Print Frame All');
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        
        let contentHtml = '';
        const waivers = [
            { id: 'main', label: 'Main Liability Release' },
            { id: 'payment', label: 'Payment & Refund Policy' },
            { id: 'code', label: 'Athlete Code of Conduct' },
            { id: 'liability', label: 'Extended Waiver of Liability' }
        ];
        
        waivers.forEach((w, idx) => {
            const keyMap: Record<string, string> = {
                main: 'mainWaiver',
                payment: 'paymentPolicy',
                code: 'codeOfConduct',
                liability: 'liabilityWaiver'
            };
            const text = (PRIVATE_ACCESS_CONFIG.trainingTerms as any)[keyMap[w.id]] || '';
            contentHtml += `
                <div class="waiver-section" style="${idx > 0 ? 'page-break-before: always;' : ''}">
                    <div class="header">
                        <h1 class="title">${w.label}</h1>
                        <p class="subtitle">Goalie Card - Private Training Agreement (Part ${idx + 1} of 4)</p>
                    </div>
                    <div class="content">${text}</div>
                </div>
            `;
        });
        
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Signed Private Training Agreement - Goalie Card</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            color: #111;
                            line-height: 1.6;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header {
                            border-bottom: 2px solid #eaeaea;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .title {
                            font-size: 22px;
                            font-weight: 700;
                            margin: 0 0 10px 0;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #666;
                            margin: 0;
                        }
                        .content {
                            font-size: 14px;
                            white-space: pre-wrap;
                            margin-bottom: 40px;
                            color: #333;
                        }
                        .signature-section {
                            border-top: 2px solid #eaeaea;
                            padding-top: 30px;
                            margin-top: 50px;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 40px;
                        }
                        .sig-box {
                            border-bottom: 1px solid #999;
                            padding-bottom: 10px;
                        }
                        .sig-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            color: #666;
                            margin-top: 5px;
                            font-weight: bold;
                        }
                        .sig-value {
                            font-family: "Georgia", serif;
                            font-style: italic;
                            font-size: 20px;
                            color: #111;
                            padding-left: 10px;
                        }
                        @media print {
                            body { padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    ${contentHtml}
                    
                    <div class="signature-section">
                        <div class="sig-box">
                            <div class="sig-value">${signature || '___________________________'}</div>
                            <div class="sig-label">Digital Signature</div>
                        </div>
                        <div class="sig-box">
                            <div class="sig-value" style="font-family: inherit; font-style: normal; font-size: 16px;">${signatureDate}</div>
                            <div class="sig-label">Date signed</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        doc.close();
        
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                const cleanUp = () => {
                    iframe.contentWindow?.removeEventListener('afterprint', cleanUp);
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    }, 1000);
                };
                iframe.contentWindow.addEventListener('afterprint', cleanUp);
                iframe.contentWindow.print();
                setTimeout(() => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                }, 60000);
            }
        }, 500);
    };

    const currentPlan = availablePlans.find(p => p.id === selectedPlan) || availablePlans[0] || {
        id: selectedPlan,
        name: 'Selected Package',
        amount: 0,
        amountFormatted: '$0',
        billingText: '',
        subtext: '',
        isRecurring: false
    };

    return (
        <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
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
                        <Lock size={12} className="opacity-60 text-zinc-400" />
                        Private Training Access
                    </div>
                </div>

                <div className="bg-[#121215]/90 backdrop-blur-2xl border border-zinc-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
                    {/* Universal Back Button */}
                    {step !== 'access-code' && !isLoading && !clientSecret && (
                        <button
                            onClick={() => {
                                if (step === 'info') setStep('access-code');
                                else if (step === 'waiver') setStep('info');
                                else if (step === 'plan-selection') setStep('waiver');
                                else if (step === 'payment-confirm') setStep('plan-selection');
                            }}
                            className="absolute top-6 left-6 p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all z-20 group"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: ACCESS CODE */}
                        {step === 'access-code' && (
                            <motion.div
                                key="access-code"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Invite-Only Access</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                        This portal is reserved for specific athletes. Please enter your invitation code to proceed.
                                    </p>
                                </div>

                                <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-600 text-center tracking-[0.3em] font-mono text-xl uppercase"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-medium">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 text-sm font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-md group"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin text-black" />
                                        ) : (
                                            <>
                                                Validate Access <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 2: ATHLETE REGISTRY (Sign Up) */}
                        {step === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Athlete Registry</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Please provide the contact details for the athlete or parent.
                                    </p>
                                </div>

                                <form onSubmit={handleInfoSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Athlete Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={athleteName}
                                                onChange={(e) => setAthleteName(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-sm font-medium"
                                                placeholder="Jake Dewey"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Parent Name (Optional)</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="text"
                                                value={parentName}
                                                onChange={(e) => setParentName(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-sm font-medium"
                                                placeholder="Parker Dewey"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Contact Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-sm font-medium"
                                                placeholder="name@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-sm font-medium"
                                                placeholder="(555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Sport</label>
                                        <select
                                            value={sport}
                                            onChange={(e) => setSport(e.target.value)}
                                            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-zinc-500 transition-all text-sm font-medium"
                                        >
                                            <option value="Lacrosse">Lacrosse</option>
                                            <option value="Hockey">Hockey</option>
                                        </select>
                                    </div>

                                    {error && (
                                        <div className="md:col-span-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-medium">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="md:col-span-2 py-4 mt-4 text-sm font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-md group"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin text-black" />
                                        ) : (
                                            <>
                                                Continue to Waivers <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 3: WAIVERS */}
                        {step === 'waiver' && (
                            <motion.div
                                key="waiver"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 mb-8 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Waiver & Terms</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                        Please review and acknowledge each of the four training agreements.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {([
                                        { id: 'main', label: 'Main Liability Release' },
                                        { id: 'payment', label: 'Payment & Refund Policy' },
                                        { id: 'code', label: 'Athlete Code of Conduct' },
                                        { id: 'liability', label: 'Extended Waiver of Liability' }
                                    ] as const).map((w) => (
                                        <div key={w.id} className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl transition-colors">
                                            <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={waiverChecks[w.id]}
                                                    onChange={(e) => setWaiverChecks({ ...waiverChecks, [w.id]: e.target.checked })}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                                                />
                                                <span className="text-xs font-semibold text-zinc-300">{w.label}</span>
                                            </label>
                                            <button 
                                                type="button"
                                                onClick={() => setViewingWaiver(w.id)}
                                                className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full"
                                            >
                                                View <ChevronRight size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Waiver Modal */}
                                <AnimatePresence>
                                    {viewingWaiver && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                                            onClick={() => setViewingWaiver(null)}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                                className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.7)] relative max-h-[85vh] flex flex-col"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-300">
                                                        {viewingWaiver === 'main' ? 'MAIN LIABILITY RELEASE' :
                                                         viewingWaiver === 'payment' ? 'PAYMENT & REFUND POLICY' :
                                                         viewingWaiver === 'code' ? 'ATHLETE CODE OF CONDUCT' :
                                                         'EXTENDED WAIVER OF LIABILITY'}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadWaiver(viewingWaiver)}
                                                            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                                            title="Print / Save PDF"
                                                        >
                                                            <Printer size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setViewingWaiver(null)} 
                                                            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-left">
                                                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                                                        {(() => {
                                                            const keyMap: Record<string, string> = {
                                                                main: 'mainWaiver',
                                                                payment: 'paymentPolicy',
                                                                code: 'codeOfConduct',
                                                                liability: 'liabilityWaiver'
                                                            };
                                                            const key = keyMap[viewingWaiver];
                                                            return (PRIVATE_ACCESS_CONFIG.trainingTerms as any)[key] || '';
                                                        })()}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setWaiverChecks({ ...waiverChecks, [viewingWaiver as keyof typeof waiverChecks]: true });
                                                        setViewingWaiver(null);
                                                    }}
                                                    className="mt-8 w-full py-4 text-xs font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-md"
                                                >
                                                    Acknowledge & Accept
                                                </button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleWaiverSubmit} className="space-y-4 pt-6 border-t border-zinc-800/80">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Digital Signature (Full Name)</label>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Required</span>
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={signature}
                                                onChange={(e) => setSignature(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-zinc-500 transition-all font-serif italic text-lg tracking-tight placeholder:text-zinc-600"
                                                placeholder="Type full legal name..."
                                            />
                                        </div>
                                        <div className="space-y-1.5 opacity-60">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Signing Date</label>
                                            <div className="px-5 py-3.5 bg-zinc-900/50 border border-zinc-800/60 rounded-xl text-xs font-mono font-bold text-zinc-300">
                                                {signatureDate}
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-medium">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    {signature && (
                                        <button
                                            type="button"
                                            onClick={handleDownloadAllWaivers}
                                            className="w-full py-3.5 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-900/40 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                                        >
                                            <Printer size={13} /> Print / Save All Signed Waivers
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || !Object.values(waiverChecks).every(v => v) || !signature}
                                        className="w-full py-4 rounded-xl mt-4 text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2 group"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin text-black" />
                                        ) : (
                                            <>
                                                Select Lessons <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 4: SELECT LESSONS (Pricing Options) */}
                        {step === 'plan-selection' && (
                            <motion.div
                                key="plan-selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 mb-8 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Select Lessons</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                        Choose your private training commitment.
                                    </p>
                                </div>

                                <div className="space-y-3.5">
                                    {availablePlans.map((plan) => (
                                        <button 
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`w-full text-left p-6 rounded-2xl border transition-all relative overflow-hidden group ${
                                                selectedPlan === plan.id 
                                                    ? 'bg-white/[0.06] border-white/80 shadow-lg ring-1 ring-white/20' 
                                                    : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg text-white whitespace-nowrap">{plan.name}</h4>
                                                        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                                                            {plan.isRecurring ? 'Membership' : 'One-Time'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 font-medium">{plan.subtext}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-2xl font-black text-white tracking-tight">{plan.amountFormatted}</p>
                                                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{plan.billingText}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setIsLoading(true);
                                            setError(null);
                                            const res = await createEmbeddedCheckoutSession(submissionId!, selectedPlan, isTestMode);
                                            if (res.error) {
                                                setError(res.error);
                                                setIsLoading(false);
                                            } else {
                                                setClientSecret(res.clientSecret!);
                                                setStep('payment-confirm');
                                                setIsLoading(false);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2 group"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin text-black" />
                                        ) : (
                                            <>
                                                Continue to Payment <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setStep('waiver')}
                                        className="w-full text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 hover:text-zinc-300 transition-colors py-2 text-center"
                                    >
                                        Back to Waivers
                                    </button>
                                </div>

                                {error && (
                                    <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-medium">
                                        <AlertCircle size={14} /> {error}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 5: PAYMENT */}
                        {step === 'payment-confirm' && (
                            <motion.div
                                key="payment-confirm"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="space-y-6 text-center"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Payment</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                        Review your selection and enter your card details to secure your private lessons.
                                    </p>
                                </div>

                                {/* Order Summary Box */}
                                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-left space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-white font-bold text-base">{currentPlan.name}</h4>
                                            <p className="text-xs text-zinc-400 font-medium">{currentPlan.subtext}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white tracking-tight">{currentPlan.amountFormatted || `$${currentPlan.amount}`}</span>
                                            <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">{currentPlan.isRecurring ? 'Membership' : 'One-Time'}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center text-xs">
                                        <span className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">Total Due Today</span>
                                        <span className="text-white font-black text-base">{currentPlan.amountFormatted || `$${currentPlan.amount}`}.00</span>
                                    </div>
                                </div>

                                {clientSecret && (
                                    <div className="mt-4 bg-[#18181b] border border-zinc-800 rounded-2xl p-4 min-h-[360px]">
                                        <EmbeddedCheckoutProvider
                                            stripe={stripePromise}
                                            options={{ clientSecret }}
                                        >
                                            <EmbeddedCheckout />
                                        </EmbeddedCheckoutProvider>
                                    </div>
                                )}

                                {!clientSecret && !isLoading && (
                                    <button 
                                        onClick={async () => {
                                            setIsLoading(true);
                                            const res = await createEmbeddedCheckoutSession(submissionId!, selectedPlan, isTestMode);
                                            if (res.error) setError(res.error);
                                            else setClientSecret(res.clientSecret!);
                                            setIsLoading(false);
                                        }}
                                        className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 transition-all shadow-md"
                                    >
                                        Re-initialize Checkout
                                    </button>
                                )}
                                
                                <div className="flex flex-col gap-2 pt-2">
                                    <button 
                                        onClick={() => {
                                            setStep('plan-selection');
                                            setClientSecret(null);
                                        }}
                                        className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-1.5 group"
                                    >
                                        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Change Package
                                    </button>
                                    
                                    <button 
                                        onClick={() => {
                                            setIsTestMode(!isTestMode);
                                            setClientSecret(null); 
                                        }}
                                        className="text-[8px] uppercase tracking-[0.3em] font-bold text-zinc-600 hover:text-zinc-400 transition-colors py-1"
                                    >
                                        Mode: {isTestMode ? 'TEST' : 'LIVE'}
                                    </button>
                                </div>

                                {error && (
                                    <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-medium">
                                        <AlertCircle size={14} /> {error}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
                    The Goalie Brand © 2026 • Private Enrollment
                </p>
            </div>
        </main>
    );
}
