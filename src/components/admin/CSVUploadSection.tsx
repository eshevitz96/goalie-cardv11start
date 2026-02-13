import { useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { parseAndUploadCSV } from '@/utils/admin-csv-parser';
import { RosterItem } from '@/types';

interface CSVUploadSectionProps {
    dbData: RosterItem[];
    onUploadComplete: () => Promise<void>;
}

export function CSVUploadSection({ dbData, onUploadComplete }: CSVUploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [targetGoalieId, setTargetGoalieId] = useState<string>("");

    // Wrappers for the utility function
    const handleParse = (text: string) => {
        parseAndUploadCSV(
            text,
            dbData,
            targetGoalieId,
            setUploadStatus,
            onUploadComplete
        );
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleParse(await file.text());
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleParse(await file.text());
            e.target.value = ''; // Reset
        }
    };

    return (
        <section className="glass rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <UploadCloud className="text-primary" />
                    Smart Import
                </h2>

                <div className="mb-4">
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Target Goalie (Optional - For missing Email columns)</label>
                    <select
                        className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary outline-none"
                        value={targetGoalieId}
                        onChange={(e) => setTargetGoalieId(e.target.value)}
                    >
                        <option value="">-- Auto-Detect from Email Column --</option>
                        {dbData.map(g => (
                            <option key={g.id} value={g.id}>{g.goalie_name} ({g.email})</option>
                        ))}
                    </select>
                </div>

                <div
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer mt-6
                        ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-foreground/50 hover:bg-muted/50'}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".csv"
                    />
                    <div className="flex flex-col items-center gap-4">
                        {uploadStatus === 'processing' ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                        <p className="font-bold text-lg">
                            {uploadStatus === 'processing' ? 'Processing...' : uploadStatus === 'success' ? 'Success!' : 'Drag & Drop CSV or Click to Upload'}
                        </p>
                        <p className="text-gray-500 text-sm">Supports partial updates (Email required)</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
