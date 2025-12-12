import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, Zap, Brain, Radar, AlertTriangle } from 'lucide-react';

interface EncodeDockProps {
    onClose: () => void;
    onProcess: (file: File, mode: 'flash' | 'focus' | 'insight') => void;
}

export const EncodeDock: React.FC<EncodeDockProps> = ({ onClose, onProcess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Limits
    const MAX_MB = 10;

    const handleFile = (selectedFile: File) => {
        setError(null);
        
        if (selectedFile.type !== 'application/pdf') {
            setError("Only PDF files are supported.");
            return;
        }

        if (selectedFile.size > MAX_MB * 1024 * 1024) {
            setError(`File exceeds ${MAX_MB}MB limit.`);
            return;
        }

        setFile(selectedFile);
    };

    // Paste Support
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                e.preventDefault();
                handleFile(e.clipboardData.files[0]);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    return (
        <div className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-[#050508] border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_100px_rgba(245,158,11,0.2)] relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/50">
                        <Brain className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Cortex Encoding</h2>
                        <p className="text-amber-300/60 text-sm font-mono uppercase tracking-widest">Single Source Deep Analysis</p>
                    </div>
                </div>

                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf"
                    className="hidden"
                />

                {!file ? (
                    /* DROP ZONE */
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`
                            w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all mb-2 cursor-pointer group
                            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5'}
                        `}
                    >
                        <div className="p-4 bg-white/5 rounded-full group-hover:bg-amber-500/20 transition-colors">
                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-300 font-medium">Drag & Drop PDF Source</p>
                            <p className="text-slate-500 text-xs mt-1">Click to browse • Max {MAX_MB}MB</p>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs mt-2 bg-red-500/10 px-3 py-1 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    /* FILE SELECTED - MODE SELECTION */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <div className="text-white font-medium">{file.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <button onClick={() => onProcess(file, 'flash')} className="group p-5 rounded-2xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/50 transition-all text-left relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                    <Zap className="w-5 h-5 text-cyan-400" />
                                    <h3 className="text-lg font-bold text-white">FLASH</h3>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed group-hover:text-cyan-100/80 relative z-10">
                                    High-velocity extraction. Creates a skeletal structure of the main concepts.
                                </p>
                            </button>

                            <button onClick={() => onProcess(file, 'focus')} className="group p-5 rounded-2xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/50 transition-all text-left relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                    <Brain className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-lg font-bold text-white">FOCUS</h3>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed group-hover:text-amber-100/80 relative z-10">
                                    Structural integrity. Builds a balanced map of core concepts and functional relationships.
                                </p>
                            </button>

                            <button onClick={() => onProcess(file, 'insight')} className="group p-5 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/50 transition-all text-left relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                    <Radar className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-bold text-white">INSIGHT</h3>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed group-hover:text-purple-100/80 relative z-10">
                                    Deep latent space. Explodes the document into granular nodes to find hidden connections.
                                </p>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};