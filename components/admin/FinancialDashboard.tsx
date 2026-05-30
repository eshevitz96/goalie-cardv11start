import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    description: string;
}

const MetricCard = ({ title, value, change, description }: MetricCardProps) => (
    <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {change}
            </span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
    </div>
);

export function FinancialDashboard() {
    // These would eventually be calculated from Stripe/Supabase data
    const metrics = [
        {
            title: "Annual Recurring Revenue (ARR)",
            value: "$372,000",
            change: "+12.5%",
            description: "Total value of all active B2C and B2B subscriptions projected over 12 months."
        },
        {
            title: "Projected EBITDA",
            value: "$269,000",
            change: "+8.2%",
            description: "Operating profit excluding non-cash items. Crucial for PE valuation multiples."
        },
        {
            title: "LTV / CAC Ratio",
            value: "4.8x",
            change: "+0.4x",
            description: "The efficiency of marketing spend. PE looks for >3.0x for high-growth tech."
        },
        {
            title: "Asset Value (Estimated)",
            value: "$2.9M",
            change: "+$240k",
            description: "Calculated based on a 4.5x ARR multiple (SaaS/Service hybrid benchmark)."
        }
    ];

    return (
        <div className="p-8 bg-black min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Coalition of Independent Coaches (CIC)</h1>
                        <p className="text-gray-400">Institutional Dashboard & Asset Management</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4">
                        <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-all">
                            View Exit Scenarios
                        </button>
                        <button className="border border-white/20 text-white px-6 py-2 rounded-full font-bold hover:bg-white/5 transition-all">
                             "$1 Buyback" Status
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#121212] border border-white/5 p-8 rounded-3xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Growth Multiples & Benchmarks</h2>
                        <div className="space-y-4">
                            {[
                                { label: "SaaS Pure-Play", multiple: "8x-12x ARR", status: "In Progress" },
                                { label: "Hybrid Coaching/Digital", multiple: "4x-6x ARR", status: "Current Target" },
                                { label: "Pure Service", multiple: "2x-3x EBITDA", status: "Exceeded" }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-gray-300 font-medium">{item.label}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-primary font-bold">{item.multiple}</span>
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-gray-400`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 p-8 rounded-3xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-4">Portnoy Clause Status</h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Legal framework for ROFR (Right of First Refusal) and nominal buyback ($1) is active under CIC Holding.
                            </p>
                            <div className="p-4 bg-black/40 rounded-xl border border-primary/20 backdrop-blur-sm">
                                <span className="text-[10px] text-primary font-bold uppercase block mb-1">Contract Status</span>
                                <span className="text-green-400 font-mono text-lg">VERIFIED SECURE</span>
                            </div>
                        </div>
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
