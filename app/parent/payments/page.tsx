"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
    ArrowLeft, 
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
import { Button } from "@/components/ui/Button";

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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading billing history...</p>
            </div>
        );
    }

    const transactions = billingData?.transactions || [];
    const invoices = billingData?.invoices || [];
    const totalSpend = billingData?.totalSpend || 0;
    const totalRefunded = transactions.reduce((acc, tx) => acc + (tx.amountRefunded || 0), 0);

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary/20">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2.5 rounded-full bg-card border border-border hover:bg-muted hover:border-border/80 transition-colors shadow-sm"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft size={18} className="text-foreground" />
                        </Link>
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">
                                Athlete & Parent Billing
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-foreground">
                                BILLING & <span className="text-primary">PAYMENTS</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleOpenPortal}
                            disabled={isPortalLoading}
                            variant="primary"
                            className="w-full sm:w-auto font-bold flex items-center gap-2 shadow-sm"
                        >
                            {isPortalLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <CreditCard size={16} />
                            )}
                            Manage Payment Method
                        </Button>
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
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Net Total Spend
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-foreground">
                            {formatCurrency(totalSpend)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All time verified training payments
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Total Transactions
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-foreground">
                            {transactions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Processed via Stripe secure checkout
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Refunds & Credits
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-foreground">
                            {formatCurrency(totalRefunded)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totalRefunded > 0 ? "Credited back to original card" : "No active refunds"}
                        </p>
                    </div>
                </div>

                {/* Transactions Card List */}
                <div className="bg-card border border-border rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-foreground">
                                Payment History
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Live records from Stripe account ({billingData?.customerEmail || "Connected"})
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>Stripe Encrypted</span>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50" />
                                <div className="text-sm font-semibold text-foreground">No payment history found</div>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Charges and private lesson packages booked under this email address will automatically appear here.
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

                                            {/* Detailed refund info if refunded */}
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
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
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

                {/* Invoices List if any */}
                {invoices.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-border">
                            <h2 className="text-base md:text-lg font-bold text-foreground">
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
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
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

            </div>
        </main>
    );
}
