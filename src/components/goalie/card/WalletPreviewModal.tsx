/* eslint-disable @next/next/no-img-element */
import { X } from "lucide-react";
import { GoalieGuardLogo as ShieldIcon } from "@/components/ui/GoalieGuardLogo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

interface WalletPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        name: string;
        team: string | undefined;
        session: number;
        id: string | undefined;
    };
}

export function WalletPreviewModal({ isOpen, onClose, data }: WalletPreviewModalProps) {
    const { name, team, session, id } = data;
    const toast = useToast();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            className="bg-transparent shadow-none border-none p-0 overflow-visible"
            hideCloseButton={true}
        >
            <div className="relative w-full max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                {/* Wallet Pass UI - Mimics PKPass */}
                <div className="bg-[#1c1c1e] w-full rounded-[24px] overflow-hidden text-white shadow-2xl border border-white/10 relative">

                    {/* Header Strip - Refined Integrated UI */}
                    <div className="bg-[#2c2c2e] p-4 flex justify-between items-center relative">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center shadow-lg border border-white/10">
                                <ShieldIcon size={16} className="text-white" />
                            </div>
                            <span className="font-bold tracking-tight text-sm">Goalie Card</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-white/5 px-2 py-1 rounded-full text-white/40 flex items-center justify-center border border-white/5">
                                <span className="text-[10px] font-bold tracking-tighter">PASS</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/10 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Pass Body */}
                    <div className="p-5 space-y-6">
                        {/* Primary Field */}
                        <div>
                            <div className="text-[10px] text-zinc-400 font-semibold uppercase">Athlete</div>
                            <div className="text-2xl font-bold font-mono tracking-tight">{name}</div>
                        </div>

                        {/* Secondary Fields */}
                        <div className="flex justify-between">
                            <div>
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Team</div>
                                <div className="text-sm font-semibold">{team || "Unattached"}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Status</div>
                                <div className="text-sm font-semibold text-green-400">Active</div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <div>
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Session</div>
                                <div className="text-sm font-semibold">{session > 0 ? session : 'PRO'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">ID</div>
                                <div className="text-sm font-mono text-zinc-300">{id?.slice(0, 8).toUpperCase() || 'DEMO-01'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Barcode Area */}
                    <div className="bg-white p-4 flex flex-col items-center justify-center gap-2 mt-4">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PKPass:${id}&color=000000`}
                            className="w-32 h-32 object-contain"
                            alt="Goalie Card QR Code"
                        />
                        <div className="text-black font-mono text-[10px]">{id}</div>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-white/50 text-xs mb-4">This is how your card appears in Apple Wallet.</p>
                    <Button onClick={() => toast.success("Verified Pass Generation: Coming Soon! This is a high-fidelity preview.")} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-500 transition-all w-full">
                        Add to Wallet
                    </Button>
                </div>

            </div>
        </Modal>
    );
}
