/* eslint-disable @next/next/no-img-element */
import { X, Wallet } from "lucide-react";
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
        <Modal isOpen={isOpen} onClose={onClose} size="sm" className="bg-transparent shadow-none border-none p-0 overflow-visible">
            <div className="bg-card w-full rounded-[32px] overflow-hidden shadow-2xl border border-border relative">
                {/* Card Header */}
                <div className="bg-gradient-to-br from-zinc-800 to-black p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg border border-white/10">
                            <GoalieGuardLogo size={24} className="text-white" />
                        </div>
                        <h3 className="text-white font-black text-xl tracking-tight">GOALIE CARD</h3>
                        <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mt-1">Official Digital ID</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-colors z-50 cursor-pointer"
                    >
                        <X size={16} />
                    </button>
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
