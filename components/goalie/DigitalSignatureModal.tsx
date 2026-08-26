import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PenTool, ArrowRight, Loader2 } from 'lucide-react';
import { Caveat } from 'next/font/google';

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'] });

interface Props {
  onComplete: () => void;
}

export function DigitalSignatureModal({ onComplete }: Props) {
  const { userId } = useAuth();
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!signature || signature.length < 2) {
      setError('Please enter your full signature.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ digital_signature: signature })
          .eq('auth_user_id', userId);

        if (updateError) throw updateError;
      }
      
      // Store in local storage as a fallback/fast-check
      localStorage.setItem('has_digital_signature', 'true');
      onComplete();
    } catch (err: any) {
      console.error('Signature save error:', err);
      setError('Failed to save signature. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md px-4 animate-in fade-in duration-300">
      <div className="bg-[#18181B] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00E676] to-transparent opacity-50" />
        
        <div className="w-12 h-12 rounded-full bg-[#00E676]/10 flex items-center justify-center mb-6 border border-[#00E676]/20">
          <PenTool size={20} className="text-[#00E676]" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Sign Your Contract</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          By signing this Goalie Card, you are committing to the process. You agree to hold yourself accountable to your weekly intentions, review your film honestly, and put in the work required to elevate your game.
        </p>

        <div className="space-y-6">
          <div>
            <div className="relative border-b-2 border-zinc-700 focus-within:border-[#00E676] transition-colors pb-1">
              <input 
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name..."
                className={`w-full bg-transparent border-0 ring-0 focus:ring-0 focus:border-0 outline-none text-4xl ${caveat.className} text-white placeholder:text-zinc-700 placeholder:font-sans placeholder:text-lg px-0 pb-6 rounded-none shadow-none`}
                autoFocus
              />
              <span className="absolute bottom-2 right-0 text-[10px] uppercase font-bold tracking-widest text-zinc-600 pointer-events-none">
                Digital Signature
              </span>
            </div>
            {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
          </div>

          <button
            onClick={handleSign}
            disabled={loading || signature.length < 2}
            className="w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none bg-white text-black hover:bg-zinc-200 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                Commit & Enter Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
