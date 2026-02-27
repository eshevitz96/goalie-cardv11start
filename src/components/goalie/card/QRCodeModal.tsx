/* eslint-disable @next/next/no-img-element */
import { Wallet, X } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    id: string;
    onPreviewWallet: () => void;
}

export function QRCodeModal({ isOpen, onClose, id, onPreviewWallet }: QRCodeModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            className="bg-transparent shadow-none border-none p-0 overflow-visible"
            hideCloseButton={true}
        >
            <div className="bg-card w-full rounded-[32px] overflow-hidden shadow-2xl border border-border relative">
                {/* Card Header */}
                <div className="bg-[#2c2c2e] p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center shadow-lg border border-white/10">
                            <GoalieGuardLogo size={16} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm tracking-tight leading-none">GOALIE CARD</span>
                            <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest mt-0.5">Official Pass</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
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

                {/* QR Section */}
                <div className="bg-white p-8 flex flex-col items-center gap-6">
                    <div className="relative w-48 h-48">
                        {/* QR API */}
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://goaliecard.app/share/${id}&color=000000&bgcolor=ffffff`}
                            alt="Goalie Card QR"
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                            Scan to Add to Wallet
                        </p>
                        <p className="text-zinc-900 font-medium text-xs max-w-[200px] mx-auto leading-relaxed">
                            This dynamic pass updates automatically with your new teams & stats.
                        </p>
                    </div>

                    {/* Wallet Button Simulation */}
                    <Button
                        onClick={onPreviewWallet}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg active:scale-95 duration-200"
                    >
                        <Wallet size={18} />
                        <span>Preview Wallet Pass</span>
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
