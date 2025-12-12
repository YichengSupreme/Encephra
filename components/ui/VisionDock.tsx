import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Eye, AlertTriangle, ScanEye } from 'lucide-react';

interface VisionDockProps {
    onClose: () => void;
    onAnalyze: (file: File) => void;
}

export const VisionDock: React.FC<VisionDockProps> = ({ onClose, onAnalyze }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Limits
    const MAX_MB = 10;

    const handleFile = (selectedFile: File) => {
        setError(null);
        
        if (!selectedFile.type.startsWith('image/')) {
            setError("Only image files (PNG, JPEG, WEBP) are supported.");
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
            <div className="w-full max-w-4xl bg-[#050508] border border-green-500/30 rounded-3xl p-8 shadow-[0_0_100px_rgba(34,197,94,0.2)] relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/50">
                        <Eye className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Protocol Occipital</h2>
                        <p className="text-green-300/60 text-sm font-mono uppercase tracking-widest">Visual Cortex Uplink</p>
                    </div>
                </div>

                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/webp"
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
                            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-green-500/50 hover:bg-green-500/5'}
                        `}
                    >
                        <div className="p-4 bg-white/5 rounded-full group-hover:bg-green-500/20 transition-colors">
                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-green-400 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-300 font-medium">Drag & Drop Diagram or Schema</p>
                            <p className="text-slate-500 text-xs mt-1">Click to browse • Max {MAX_MB}MB</p>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs mt-2 bg-red-500/10 px-3 py-1 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    /* FILE SELECTED */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <ImageIcon className="w-6 h-6 text-green-500" />
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

                        {/* Preview if it's an image */}
                        <div className="w-full h-48 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 relative group">
                            <img 
                                src={URL.createObjectURL(file)} 
                                alt="Preview" 
                                className="h-full w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-4">
                                <span className="text-xs text-green-200 font-mono">PREVIEW STREAM</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => onAnalyze(file)} 
                            className="w-full group p-5 rounded-2xl bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 hover:border-green-500 transition-all text-center relative overflow-hidden"
                        >
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                <ScanEye className="w-6 h-6 text-green-400 group-hover:text-white transition-colors" />
                                <h3 className="text-lg font-bold text-green-100 group-hover:text-white tracking-widest uppercase">Initiate Analysis</h3>
                            </div>
                            <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};