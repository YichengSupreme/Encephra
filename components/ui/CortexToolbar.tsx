import React from 'react';
import { Settings2, Info, Plus, Minus, Network, Brain, Zap, Fingerprint, Radar, FlaskConical, Eye } from 'lucide-react';

interface CortexToolbarProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    setShowHelp: (v: boolean) => void;
    onAddNode: () => void;
    
    isDeleteMode: boolean;
    onToggleDeleteMode: () => void;
    
    isLinkMode: boolean;
    onToggleLinkMode: () => void;
    
    isEnhancedMode: boolean;
    onToggleEnhancedMode: () => void;
    
    // New Research Mode Toggle
    onOpenResearch: () => void;
    
    isEntropyMode: boolean;
    onToggleEntropyMode: () => void;
    
    isEngramMode: boolean;
    onToggleEngramMode: () => void;
    
    isInferenceMode: boolean;
    onToggleInferenceMode: () => void;
    
    hasApiKey: boolean;
}

export const CortexToolbar: React.FC<CortexToolbarProps> = ({
    isOpen, setIsOpen, setShowHelp, onAddNode,
    isDeleteMode, onToggleDeleteMode,
    isLinkMode, onToggleLinkMode,
    isEnhancedMode, onToggleEnhancedMode,
    onOpenResearch, // New Prop
    isEntropyMode, onToggleEntropyMode,
    isEngramMode, onToggleEngramMode,
    isInferenceMode, onToggleInferenceMode,
    hasApiKey
}) => {
    return (
        <div className="flex gap-4 items-end">
            <div className="flex gap-4">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(79,209,197,0.2)]
                        ${isOpen ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-black/40 border-white/10 text-cyan-400 hover:bg-black/60 hover:text-white'}
                    `}
                    title="Settings"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
                
                <button 
                    onClick={() => setShowHelp(true)}
                    className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:bg-black/60 hover:text-white transition-all"
                    title="Help"
                >
                    <Info className="w-5 h-5" />
                </button>

                <button 
                    onClick={onAddNode}
                    className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-all"
                    title="Add Thought"
                >
                    <Plus className="w-6 h-6" />
                </button>

                <button 
                    onClick={onToggleDeleteMode}
                    className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all ${
                        isDeleteMode 
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
                        : 'bg-black/40 border-white/10 text-red-400 hover:bg-red-500/20'
                    }`}
                    title="Delete Mode"
                >
                    <Minus className="w-6 h-6" />
                </button>

                <button 
                    onClick={onToggleLinkMode}
                    className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all ${
                        isLinkMode 
                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse' 
                        : 'bg-black/40 border-white/10 text-purple-400 hover:bg-purple-500/20'
                    }`}
                    title="Synapse Mode"
                >
                    <Network className="w-5 h-5" />
                </button>

                <button 
                    onClick={onToggleEnhancedMode}
                    className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all ${
                        isEnhancedMode
                        ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]' 
                        : 'bg-black/40 border-white/10 text-amber-500 hover:bg-amber-500/20'
                    }`}
                    title="Cortex Mode"
                >
                    <Brain className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export const EnhancedToolbar: React.FC<{
    isEnhancedMode: boolean;
    isLinkMode: boolean;
    isEntropyMode: boolean;
    isEngramMode: boolean;
    isInferenceMode: boolean;
    onToggleLinkMode: () => void;
    onToggleEntropyMode: () => void;
    onToggleEngramMode: () => void;
    onToggleInferenceMode: () => void;
    onPdfUpload: () => void;
    onImageUpload: () => void; // New Prop for Vision
    onOpenResearch: () => void; 
    engramCount: number;
    inferenceCount: number;
    isProcessing: boolean;
}> = ({
    isEnhancedMode, isLinkMode, isEntropyMode, isEngramMode, isInferenceMode,
    onToggleLinkMode, onToggleEntropyMode, onToggleEngramMode, onToggleInferenceMode,
    onPdfUpload, onImageUpload, onOpenResearch, engramCount, inferenceCount, isProcessing
}) => {
    return (
        <div className={`pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 md:bottom-6 md:left-[62%] flex flex-col items-center gap-4 transition-all duration-500 z-30 ${
            isEnhancedMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}>
             <div className="bg-amber-950/80 backdrop-blur-xl border border-amber-500/30 px-6 py-3 rounded-2xl flex items-center gap-6 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest border-r border-amber-500/20 pr-6">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-100">Cortex Active</span>
                </div>
                
                <div className="flex items-center gap-2">
                     <button 
                        onClick={onPdfUpload}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-100 transition-colors text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-50"
                     >
                         <Brain className="w-4 h-4 text-amber-500" />
                         <span>Encode</span>
                     </button>
                     
                     <button 
                        onClick={onImageUpload}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 hover:text-orange-200 text-amber-100 transition-colors text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-50"
                        title="Occipital Uplink (Vision)"
                     >
                         <Eye className="w-4 h-4 text-orange-500" />
                         <span>Occipital</span>
                     </button>

                     <button 
                        onClick={onOpenResearch}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 hover:text-orange-200 text-amber-100 transition-colors text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-50"
                     >
                         <FlaskConical className="w-4 h-4 text-orange-500" />
                         <span>Research</span>
                     </button>
                     
                     <div className="w-px h-4 bg-amber-500/20 mx-1"></div>
                     
                     <button 
                        onClick={onToggleLinkMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest border border-transparent 
                        ${isLinkMode 
                            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                            : 'hover:bg-amber-500/20 text-amber-100 hover:border-amber-500/30'
                        }`}
                     >
                        <Network className={`w-4 h-4 ${isLinkMode ? 'text-black' : 'text-amber-500'}`} />
                        <span>Interneuron</span>
                     </button>

                     <button 
                        onClick={onToggleEntropyMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest border border-transparent 
                        ${isEntropyMode 
                            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                            : 'hover:bg-amber-500/20 text-amber-100 hover:border-amber-500/30'
                        }`}
                     >
                        <Zap className={`w-4 h-4 ${isEntropyMode ? 'text-black' : 'text-amber-500'}`} />
                        <span>Entropy</span>
                     </button>

                     <button 
                        onClick={onToggleEngramMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest border border-transparent 
                        ${isEngramMode 
                            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                            : 'hover:bg-amber-500/20 text-amber-100 hover:border-amber-500/30'
                        }`}
                     >
                        <Fingerprint className={`w-4 h-4 ${isEngramMode ? 'text-black' : 'text-amber-500'}`} />
                        <span>Engram</span>
                        {engramCount > 0 && <span className="ml-1 opacity-60">({engramCount})</span>}
                     </button>

                     <button 
                        onClick={onToggleInferenceMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest border border-transparent 
                        ${isInferenceMode 
                            ? 'bg-[#f97316] text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]' 
                            : 'hover:bg-[#f97316]/20 text-amber-100 hover:border-[#f97316]/30'
                        }`}
                     >
                        <Radar className={`w-4 h-4 ${isInferenceMode ? 'text-black' : 'text-[#f97316]'}`} />
                        <span>Inference</span>
                        {inferenceCount > 0 && <span className="ml-1 opacity-60">({inferenceCount})</span>}
                     </button>
                </div>
             </div>
        </div>
    )
}