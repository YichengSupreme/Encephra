import React from 'react';
import { Fingerprint, Radar, Bookmark, Zap, Move } from 'lucide-react';
import { NodeData } from '../../types';
import { stringToColor } from '../SceneComponents';

// --- ENGRAM HUD ---
export const EngramHUD: React.FC<{
    nodes: NodeData[];
    selection: Set<number>;
    depth: 'trace' | 'engram' | 'consolidation';
    setDepth: (d: 'trace' | 'engram' | 'consolidation') => void;
    onGenerate: () => void;
    isProcessing: boolean;
    result: { title: string, summary: string } | null;
    displayedSummary: string;
    summaryRef: React.RefObject<HTMLDivElement>;
    onSave: () => void;
}> = ({ nodes, selection, depth, setDepth, onGenerate, isProcessing, result, displayedSummary, summaryRef, onSave }) => (
    <div className="pointer-events-auto absolute left-6 top-1/2 -translate-y-1/2 w-80 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500 z-30">
        <div className="bg-[#050508]/80 backdrop-blur-xl border border-amber-500/20 p-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-3 mb-4 border-b border-amber-500/10 pb-3">
                <Fingerprint className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-[0.2em]">Engram Terminal</span>
            </div>
            
            <div className="space-y-1 mb-6 max-h-32 overflow-y-auto custom-scrollbar scrollbar-amber">
                {selection.size > 0 ? Array.from(selection).map(id => {
                    const n = nodes.find(node => node.id === id);
                    return n ? (
                        <div key={id} className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            {n.title.substring(0, 25)}{n.title.length > 25 ? '...' : ''}
                        </div>
                    ) : null;
                }) : (
                    <div className="text-[10px] font-mono text-slate-600 italic">Select nodes to begin sequence...</div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {(['trace', 'engram', 'consolidation'] as const).map(d => (
                    <button
                        key={d}
                        onClick={() => setDepth(d)}
                        className={`py-2 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all border ${
                            depth === d 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                            : 'bg-black/20 text-slate-500 border-transparent hover:bg-white/5'
                        }`}
                    >
                        {d === 'consolidation' ? 'Consol.' : d}
                    </button>
                ))}
            </div>

            <button 
                onClick={onGenerate}
                disabled={selection.size === 0 || isProcessing}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
                {isProcessing ? 'Synthesizing...' : 'Generate'}
            </button>
        </div>

        {result && (
            <div className="bg-[#050508]/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">ENGRAM ID:</div>
                <h3 className="font-mono text-lg font-bold text-white mb-4 tracking-tight leading-tight">{result.title}</h3>
                <div 
                    ref={summaryRef}
                    className="font-mono text-xs text-amber-100/80 leading-relaxed mb-4 min-h-[60px] max-h-[50vh] overflow-y-auto custom-scrollbar scrollbar-amber pr-2"
                >
                    {displayedSummary}
                    <span className="animate-pulse inline-block w-1.5 h-3 bg-amber-500 ml-1 align-middle"></span>
                </div>
                <div className="flex justify-end pt-2 border-t border-white/5">
                    <button onClick={onSave} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
    </div>
);

// --- INFERENCE HUD ---
export const InferenceHUD: React.FC<{
    selectionCount: number;
    onSelectAll: () => void;
    onClear: () => void;
    onGenerate: () => void;
    isProcessing: boolean;
    tagColors: Record<string, string>;
    uniqueTags: string[];
    onSelectByTag: (tag: string) => void;
    showTagSelect: boolean;
    setShowTagSelect: (v: boolean) => void;
}> = ({ selectionCount, onSelectAll, onClear, onGenerate, isProcessing, tagColors, uniqueTags, onSelectByTag, showTagSelect, setShowTagSelect }) => (
    <div className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 duration-500 z-30">
        <div className="bg-[#050508]/90 backdrop-blur-xl border border-red-500/30 p-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center gap-4">
            <div className="flex flex-col items-start border-r border-red-500/20 pr-4">
                <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-bold">Inference Engine</span>
                <span className="text-[10px] text-slate-400">Context: {selectionCount} Nodes</span>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={onSelectAll} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-white font-mono uppercase tracking-wider transition-colors">
                    All
                </button>
                
                <div className="relative">
                    <button onClick={() => setShowTagSelect(!showTagSelect)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-white font-mono uppercase tracking-wider transition-colors flex items-center gap-1">
                        By Tag <Move className="w-3 h-3 rotate-90" />
                    </button>
                    {showTagSelect && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 max-h-48 overflow-y-auto bg-[#050508] border border-white/20 rounded-lg shadow-xl custom-scrollbar z-50 p-1">
                            {uniqueTags.map(tag => (
                                <button key={tag} onClick={() => onSelectByTag(tag)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white rounded flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: tagColors[tag] || stringToColor(tag)}}></div>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <button onClick={onClear} className="px-3 py-1.5 hover:bg-red-500/10 text-xs text-red-400 hover:text-red-300 font-mono uppercase tracking-wider transition-colors">
                    Clear
                </button>
            </div>

            <div className="w-px h-8 bg-white/10 mx-1"></div>

            <button onClick={onGenerate} disabled={selectionCount === 0 || isProcessing} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isProcessing ? 'Thinking...' : 'Generate'}
            </button>
        </div>
    </div>
);

// --- ENTROPY HUD ---
export const EntropyHUD: React.FC<{
    selectionCount: number;
    onInitiate: () => void;
}> = ({ selectionCount, onInitiate }) => {
    if (selectionCount < 2) return null; // Only show when ready

    return (
        <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in duration-300">
            <button 
                onClick={onInitiate}
                className="group relative flex items-center justify-center gap-4 px-8 py-4 bg-black/80 backdrop-blur-xl border-2 border-amber-500 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:bg-amber-950/80 transition-all hover:scale-105"
            >
                <div className="absolute inset-0 bg-amber-500/10 rounded-2xl animate-pulse"></div>
                <Zap className="w-6 h-6 text-amber-500 fill-current animate-[bounce_1s_infinite]" />
                <span className="text-lg font-mono font-bold text-amber-500 tracking-[0.2em] uppercase">
                    Initiate Collision
                </span>
            </button>
            <div className="text-center mt-4 text-xs font-mono text-amber-500/70 tracking-widest uppercase animate-pulse">
                High-Energy Synthesis Ready
            </div>
        </div>
    );
};