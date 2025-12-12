import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, FlaskConical, AlertTriangle } from 'lucide-react';
import { geminiService } from '../../services/GeminiService';

interface ResearchDockProps {
    onClose: () => void;
    onSynthesize: (data: any) => void;
}

export const ResearchDock: React.FC<ResearchDockProps> = ({ onClose, onSynthesize }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Limits
    const MAX_FILES = 5;
    const MAX_MB = 20;

    const totalSize = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    const isOverLimit = totalSize > MAX_MB;

    const addFiles = (newFiles: File[]) => {
        setError(null);
        if (files.length >= MAX_FILES) return;
        
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            setError("Only PDF files are supported.");
            return;
        }

        // Prevent duplicates
        const uniqueNewFiles = pdfFiles.filter(nf => !files.some(ef => ef.name === nf.name && ef.size === nf.size));

        if (uniqueNewFiles.length === 0) return;

        const updatedFiles = [...files, ...uniqueNewFiles].slice(0, MAX_FILES);
        setFiles(updatedFiles);
    };

    // Handle Paste Events
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                e.preventDefault();
                const pastedFiles = Array.from(e.clipboardData.files);
                addFiles(pastedFiles);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [files]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
        // Reset value so same file can be selected again if removed
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
        setError(null);
    };

    const handleSynthesize = async () => {
        if (files.length === 0) return;
        if (isOverLimit) {
            setError("Total size exceeds 20MB limit. Remove large files.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Convert all to Base64
            const payloads = await Promise.all(files.map(async (file) => {
                return new Promise<{data: string, mimeType: string, name: string}>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const raw = e.target?.result as string;
                        const base64 = raw.split(',')[1];
                        resolve({
                            data: base64,
                            mimeType: 'application/pdf',
                            name: file.name
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));

            const result = await geminiService.synthesizeResearch(payloads);
            onSynthesize(result);
            onClose();
        } catch (e) {
            console.error(e);
            setError("Synthesis failed. Try fewer or smaller documents.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#050508] border border-indigo-500/30 rounded-3xl p-8 shadow-[0_0_100px_rgba(99,102,241,0.2)] relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/50">
                        <FlaskConical className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Research Multiverse</h2>
                        <p className="text-indigo-300/60 text-sm font-mono uppercase tracking-widest">Multi-PDF Comparative Synthesis</p>
                    </div>
                </div>

                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf"
                    multiple
                    className="hidden"
                />

                {/* Drop Zone */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`
                        w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all mb-6 cursor-pointer group
                        ${isOverLimit ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5'}
                    `}
                >
                    <div className="p-4 bg-white/5 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-300 font-medium">Drag & Drop or Paste PDFs</p>
                        <p className="text-slate-500 text-xs mt-1">Click to browse • Up to 5 files • Max 20MB Total</p>
                    </div>
                </div>

                {/* File List */}
                <div className="space-y-3 mb-8">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-slate-200 truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-slate-500 font-mono">{(file.size / (1024*1024)).toFixed(2)} MB</span>
                            </div>
                            <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="text-center py-4 text-slate-600 italic text-sm">Waiting for documents...</div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="flex flex-col gap-4">
                    {/* Meter */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{width: `${(totalSize / MAX_MB) * 100}%`}}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                        <span className={isOverLimit ? 'text-red-400' : 'text-slate-400'}>
                            {totalSize.toFixed(1)} / {MAX_MB} MB
                        </span>
                        {isOverLimit && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Payload too heavy</span>}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleSynthesize}
                        disabled={files.length === 0 || isOverLimit || isProcessing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="font-mono uppercase tracking-widest">Synthesizing Universe...</span>
                            </>
                        ) : (
                            <span className="font-mono uppercase tracking-widest">Initialize Research</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};