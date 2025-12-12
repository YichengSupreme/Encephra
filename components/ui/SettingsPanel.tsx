import React from 'react';
import { Activity, Share2, Layers, Magnet, Key, Globe, Copy, Download, Upload, RefreshCw, Radiation, X } from 'lucide-react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    
    apiKey: string;
    onSetApiKey: (k: string) => void;
    
    nodeCount: number;
    linkCount: number;
    clusterStrength: number;
    setClusterStrength: (v: number) => void;
    
    onShare: () => void;
    onExport: () => void;
    onImportClick: () => void;
    onLoadDemo: () => void;
    onResetClick: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen, onClose, apiKey, onSetApiKey, nodeCount, linkCount, clusterStrength, setClusterStrength,
    onShare, onExport, onImportClick, onLoadDemo, onResetClick
}) => {
    const actionBtnClass = "group relative flex flex-col items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 overflow-hidden shadow-lg";

    return (
        <div className={`pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom-left ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8 pointer-events-none'
        }`}>
            <footer className="w-[90vw] max-w-sm md:w-80 bg-[#050508]/95 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-white/90">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">System Status</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-1">Cortex Uplink (Gemini AI)</div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Key className="w-3 h-3" />
                            </div>
                            <input 
                                type="password"
                                value={apiKey}
                                onChange={(e) => onSetApiKey(e.target.value)}
                                placeholder="Enter API Key"
                                className="block w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            />
                            {apiKey && (
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] text-slate-600 px-1">Required for synthesis features.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="group flex flex-col gap-1 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                <Share2 className="w-3 h-3 text-cyan-400"/> Nodes
                            </div>
                            <div className="text-2xl font-mono text-white font-medium tracking-tight">
                                {nodeCount.toString().padStart(3, '0')}
                            </div>
                        </div>
                        <div className="group flex flex-col gap-1 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                <Layers className="w-3 h-3 text-purple-400"/> Synapses
                            </div>
                            <div className="text-2xl font-mono text-white font-medium tracking-tight">
                                {linkCount.toString().padStart(3, '0')}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-2"><Magnet className="w-3 h-3 text-pink-500"/> Gravity Well</span>
                            <span className="text-white">{(clusterStrength * 100).toFixed(0)}%</span>
                        </div>
                        <div className="relative h-6 flex items-center select-none group">
                            <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full"></div>
                            <div className="absolute left-0 h-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full" style={{width: `${clusterStrength * 100}%`}}></div>
                            <div className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_15px_rgba(192,132,252,0.6)] border-2 border-purple-500 cursor-grab z-20" style={{left: `calc(${clusterStrength * 100}% - 8px)`}}></div>
                            <input type="range" min="0" max="1" step="0.01" value={clusterStrength} onChange={(e) => setClusterStrength(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"/>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 pl-1">Data Protocols</div>
                        <div className="space-y-3">
                            <button onClick={onShare} className="group relative w-full flex items-center justify-between px-4 py-3 bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/30 hover:border-cyan-500/50 rounded-xl transition-all duration-300 shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400"><Globe className="w-4 h-4" /></div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-bold text-cyan-100 tracking-wider">SHARE UNIVERSE</div>
                                        <div className="text-[9px] text-cyan-500/60 font-mono">Copy Public Link</div>
                                    </div>
                                </div>
                                <Copy className="w-3 h-3 text-cyan-700 group-hover:text-cyan-400 transition-colors" />
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={onExport} className={actionBtnClass}>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors relative z-10" />
                                    <span className="text-[9px] font-bold text-slate-300 group-hover:text-amber-200 tracking-wider relative z-10 uppercase">Export JSON</span>
                                </button>
                                <button onClick={onImportClick} className={actionBtnClass}>
                                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors relative z-10" />
                                    <span className="text-[9px] font-bold text-slate-300 group-hover:text-emerald-200 tracking-wider relative z-10 uppercase">Import JSON</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <div className="flex gap-2">
                            <button onClick={() => { onLoadDemo(); onClose(); }} className={`${actionBtnClass} flex-row py-3 flex-1 h-auto shadow-none`}>
                                <RefreshCw className="w-3 h-3 text-slate-300 group-hover:text-blue-400 transition-all relative z-10" />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-blue-200 tracking-wider relative z-10 uppercase">Load Demo</span>
                            </button>
                            <div className="w-px bg-white/10 my-1"></div>
                            <button onClick={onResetClick} className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors group">
                                <Radiation className="w-3 h-3 group-hover:animate-pulse" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Reset</span>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};