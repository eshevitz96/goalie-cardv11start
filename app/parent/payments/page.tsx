"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
    ChevronLeft, 
    CreditCard, 
    ExternalLink, 
    CheckCircle2, 
    RotateCcw, 
    AlertCircle, 
    Receipt, 
    Loader2, 
    ShieldCheck, 
    FileText 
} from "lucide-react";
import { fetchParentBillingData, ParentBillingData, TransactionItem, InvoiceItem } from "./actions";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";

export default function ParentBillingPage() {
    const [billingData, setBillingData] = useState<ParentBillingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchParentBillingData();
                setBillingData(data);
            } catch (err) {
                console.error("Failed to load billing records:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleOpenPortal = async () => {
        setIsPortalLoading(true);
        setPortalError(null);
        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const json = await res.json();
            if (json.url) {
                window.location.href = json.url;
            } else {
                setPortalError(json.error || "Failed to launch billing portal");
            }
        } catch (err: any) {
            setPortalError(err.message || "Failed to open Stripe portal");
        } finally {
            setIsPortalLoading(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "";
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Loading billing history...</p>
            </div>
        );
    }

    const transactions = billingData?.transactions || [];
    const invoices = billingData?.invoices || [];
    const totalSpend = billingData?.totalSpend || 0;
    const totalRefunded = transactions.reduce((acc, tx) => acc + (tx.amountRefunded || 0), 0);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pb-[calc(100px+env(safe-area-inset-bottom))] md:pb-12 font-sans">
            {/* Top Navigation & Header - Follows Unified App Shell */}
            <header className="sticky top-0 z-[1100] w-full bg-background border-b border-border h-auto md:h-20">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-16 flex flex-col md:flex-row justify-between items-center h-full py-3 md:py-0 gap-3 md:gap-0">
                    {/* Left Group: Breadcrumbs & Navigation */}
                    <div className="flex items-center justify-between md:justify-start gap-4 md:gap-12 w-full md:w-auto h-full">
                        <Link 
                            href="/dashboard"
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[0.95rem] font-medium transition-colors font-sans tracking-tight"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                            Dashboard
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4 text-xl md:text-2xl">
                            <Link 
                                href="/dashboard"
                                className="text-foreground tracking-tight font-sans font-bold text-[1.25rem] md:text-[1.4rem] hover:text-foreground/80 transition-colors"
                            >
                                Goalie Card
                            </Link>
                            
                            <span className="text-muted-foreground/30 font-light hidden md:inline">
                                /
                            </span>
                            
                            <span className="text-muted-foreground font-medium tracking-tight font-sans text-[1.3rem] md:text-[1.5rem] hidden md:inline">
                                Billing
                            </span>
                        </div>
                    </div>

                    {/* Right Group: Manage Payment Method */}
                    <div className="w-full md:w-auto flex items-center justify-end gap-3">
                        <button
                            onClick={handleOpenPortal}
                            disabled={isPortalLoading}
                            className="px-4 py-2 bg-foreground text-background font-bold rounded-xl text-xs md:text-sm hover:bg-foreground/90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPortalLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <CreditCard size={16} />
                            )}
                            Manage Payment Method
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Drawer */}
            <main className="w-full max-w-[1600px] mx-auto px-4 py-6 md:px-16 md:py-8 flex-1 flex flex-col gap-6">
                
                {/* Drawer Page Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-2xl md:text-[2.2rem] font-bold tracking-tight text-foreground font-sans">
                            Billing & Invoices
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Live verified records from your connected Stripe customer account ({billingData?.customerEmail || "Connected"}).
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium self-start sm:self-auto">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>Stripe Encrypted & Secure</span>
                    </div>
                </div>

                {portalError && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{portalError}</span>
                    </div>
                )}

                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Net Total Spend
                        </div>
                        <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-sans">
                            {formatCurrency(totalSpend)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All-time verified training payments
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Total Transactions
                        </div>
                        <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-sans">
                            {transactions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Processed via Stripe secure checkout
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Refunds & Credits
                        </div>
                        <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-sans">
                            {formatCurrency(totalRefunded)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totalRefunded > 0 ? "Credited back to original card" : "No active refunds"}
                        </p>
                    </div>
                </div>

                {/* Transactions Card List */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-foreground font-sans">
                                Payment History
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Verified lesson charges and subscription payments
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50" />
                                <div className="text-sm font-semibold text-foreground">No payment history found</div>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Charges and private lesson packages booked under this account will automatically appear here.
                                </p>
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div 
                                    key={tx.id} 
                                    className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                            tx.status === 'refunded' 
                                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                                : tx.status === 'partially_refunded'
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                            {tx.status === 'refunded' ? (
                                                <RotateCcw size={18} />
                                            ) : (
                                                <CheckCircle2 size={18} />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="font-bold text-sm md:text-base text-foreground flex items-center gap-2 flex-wrap">
                                                <span>{tx.description}</span>
                                                {tx.status === 'refunded' && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase tracking-wide">
                                                        Refunded
                                                    </span>
                                                )}
                                                {tx.status === 'partially_refunded' && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wide">
                                                        Partially Refunded
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                                <span>{formatDate(tx.date)}</span>
                                                <span>•</span>
                                                <span className="font-mono text-[11px]">{tx.id.slice(-8)}</span>
                                                {tx.paymentMethodBrand && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="capitalize">{tx.paymentMethodBrand} •••• {tx.paymentMethodLast4}</span>
                                                    </>
                                                )}
                                            </div>

                                            {tx.amountRefunded > 0 && (
                                                <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-1">
                                                    <RotateCcw size={12} />
                                                    <span>Refunded: {formatCurrency(tx.amountRefunded)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                                        <div className="text-right">
                                            <div className={`font-mono font-bold text-base md:text-lg ${
                                                tx.status === 'refunded' ? 'line-through text-muted-foreground' : 'text-foreground'
                                            }`}>
                                                {formatCurrency(tx.amount)}
                                            </div>
                                            {tx.status === 'partially_refunded' && (
                                                <div className="font-mono text-xs font-bold text-emerald-600">
                                                    Net: {formatCurrency(tx.netAmount)}
                                                </div>
                                            )}
                                        </div>

                                        {tx.receiptUrl && (
                                            <a
                                                href={tx.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-foreground hover:underline"
                                            >
                                                <span>Receipt</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Invoices List */}
                {invoices.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-border">
                            <h2 className="text-base md:text-lg font-bold text-foreground font-sans">
                                Invoices
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Downloadable PDF tax invoices and receipts
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-foreground">
                                                {inv.number ? `Invoice #${inv.number}` : "Stripe Invoice"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDate(inv.date)} • {formatCurrency(inv.amountPaid || inv.amountDue)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {inv.invoicePdf && (
                                            <a
                                                href={inv.invoicePdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-foreground hover:underline flex items-center gap-1"
                                            >
                                                <span>PDF</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {inv.hostedInvoiceUrl && (
                                            <a
                                                href={inv.hostedInvoiceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <span>View</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
            <MobileBottomNav />
        </div>
    );
}
