import React, { useState, useRef, useEffect } from 'react';
import { Activity, Share2, Info, Settings2, X, Search, Magnet, Trash2, MousePointer2, Move, MousePointerClick, Plus, Network, Minus, AlertTriangle, Layers, Radiation, RefreshCw, Copy, Check, Globe, Download, Upload, Key, BrainCircuit, Brain, Sparkles, FileText, Zap, ScanEye, Microscope, Loader2 } from 'lucide-react';
import { NodeData, LinkData } from '../types';
import { geminiService } from '../services/GeminiService';

interface UIOverlayProps {
  nodeCount: number;
  linkCount: number;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  clusterStrength: number;
  setClusterStrength: (n: number) => void;
  onReset: () => void;
  onLoadDemo: () => void;
  onAddNode: () => void;
  onToggleDeleteMode: () => void;
  isDeleteMode: boolean;
  isLinkMode: boolean;
  onToggleLinkMode: () => void;
  // Modal Props
  nodeToDelete: NodeData | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  // Import/Export Props
  nodes: NodeData[];
  links: LinkData[];
  tagColors: Record<string, string>;
  onImport: (data: any) => void;
  // AI Props
  apiKey: string;
  onSetApiKey: (key: string) => void;
  // Enhanced Mode
  isEnhancedMode: boolean;
  onToggleEnhancedMode: () => void;
  // Injection for AI
  onInjectCluster: (data: any) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  nodeCount, 
  linkCount,
  searchQuery, setSearchQuery,
  clusterStrength, setClusterStrength,
  onReset,
  onLoadDemo,
  onAddNode,
  onToggleDeleteMode,
  isDeleteMode,
  isLinkMode,
  onToggleLinkMode,
  nodeToDelete,
  onConfirmDelete,
  onCancelDelete,
  nodes,
  links,
  tagColors,
  onImport,
  apiKey,
  onSetApiKey,
  isEnhancedMode,
  onToggleEnhancedMode,
  onInjectCluster
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'info' | 'warning'} | null>(null);
  
  // PDF / AI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showModeSelect, setShowModeSelect] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Loading Dots Animation Effect
  useEffect(() => {
    if (isProcessing) {
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            setLoadingText(".".repeat(dots));
        }, 500);
        return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const handleShare = () => {
    // 1. Detect if running locally (file://)
    if (window.location.protocol === 'file:') {
        setToast({
            msg: "Cannot share local link! You must upload these files to a web host (e.g. Netlify) first.",
            type: "warning"
        });
        setTimeout(() => setToast(null), 6000);
        return;
    }

    // 2. Standard Web Share
    navigator.clipboard.writeText(window.location.href);
    setToast({
        msg: "Link copied! Friends will start fresh (your data is private).",
        type: "success"
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = () => {
    try {
        const data = {
            nodes,
            links,
            tagColors,
            config: {
                nodeCount: nodes.length,
                clusterStrength: clusterStrength
            },
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `neuroflow-backup-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setToast({ msg: "Universe exported successfully.", type: 'success' });
        setTimeout(() => setToast(null), 3000);
    } catch (e) {
        setToast({ msg: "Export failed.", type: 'warning' });
    }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              onImport(json);
              setToast({ msg: "Universe imported successfully.", type: 'success' });
              setTimeout(() => setToast(null), 3000);
              setIsOpen(false);
          } catch (err) {
              setToast({ msg: "Failed to read file.", type: 'warning' });
              setTimeout(() => setToast(null), 3000);
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset so same file can be selected again
  };

  const handleEnhancedToggle = () => {
      if (!apiKey && !isEnhancedMode) {
          setToast({ msg: "Gemini API Key required to activate Cortex.", type: 'warning' });
          setTimeout(() => setToast(null), 3000);
          setIsOpen(true);
          return;
      }
      onToggleEnhancedMode();
  };

  // PDF Handling
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
          setToast({ msg: "Only PDF files are supported.", type: 'warning' });
          setTimeout(() => setToast(null), 3000);
          return;
      }
      setPdfFile(file);
      setShowModeSelect(true);
      e.target.value = '';
  };

  const processPdf = async (mode: 'flash' | 'focus' | 'insight') => {
      setShowModeSelect(false);
      if (!pdfFile) return;

      setIsProcessing(true);
      
      try {
          const reader = new FileReader();
          reader.onload = async (e) => {
             const base64Raw = e.target?.result as string;
             // Remove data:application/pdf;base64, prefix
             const base64Data = base64Raw.split(',')[1];
             
             try {
                 const graphData = await geminiService.processDocument(base64Data, 'application/pdf', mode);
                 onInjectCluster(graphData);
                 setToast({ msg: "Synthesis Complete. Expanding Graph...", type: 'success' });
             } catch (err) {
                 console.error(err);
                 setToast({ msg: "Neural Synthesis Failed.", type: 'warning' });
             } finally {
                 setIsProcessing(false);
                 setTimeout(() => setToast(null), 4000);
             }
          };
          reader.readAsDataURL(pdfFile);

      } catch (e) {
          setIsProcessing(false);
          setToast({ msg: "File Read Error", type: 'warning' });
      }
  };

  const getToastStyles = (type: string) => {
    switch(type) {
        case 'warning': 
            return {
                bg: 'bg-[#0a0a0c] border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]',
                iconBg: 'bg-yellow-500/20',
                iconColor: 'text-yellow-400',
                Icon: AlertTriangle
            };
        case 'info':
            return {
                bg: 'bg-[#0a0a0c] border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
                iconBg: 'bg-amber-500/20',
                iconColor: 'text-amber-400',
                Icon: BrainCircuit
            };
        case 'success':
        default:
            return {
                bg: 'bg-[#0a0a0c] border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]',
                iconBg: 'bg-cyan-500/20',
                iconColor: 'text-cyan-400',
                Icon: Check
            };
    }
  };

  const toastStyle = toast ? getToastStyles(toast.type) : null;

  // Reusable button style for the main action buttons (Export, Import, Demo)
  const actionBtnClass = "group relative flex flex-col items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 overflow-hidden shadow-lg";

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
      
      {/* Hidden PDF Input */}
      <input
        type="file"
        ref={pdfInputRef}
        onChange={handlePdfUpload}
        accept=".pdf"
        className="hidden"
      />

      {/* Futuristic Loading Overlay */}
      {isProcessing && (
        <div className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-2 border-amber-500/50 rounded-full animate-spin [animation-duration:1.5s]"></div>
                    <div className="absolute inset-4 border-b-2 border-amber-500/30 rounded-full animate-spin [animation-duration:2s] reverse"></div>
                    
                    {/* Inner Pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-amber-500 animate-pulse" />
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="text-amber-500 font-mono text-lg tracking-[0.2em] font-bold">
                        UPLINKING{loadingText}
                    </div>
                    <div className="text-amber-500/50 text-xs font-mono mt-2 uppercase tracking-widest">
                        Decoding Binary / Extracting Concepts
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Enhanced Mode AI Toolbar */}
      <div className={`pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-all duration-500 z-30 ${
          isEnhancedMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}>
          <div className="bg-amber-950/80 backdrop-blur-xl border border-amber-500/30 px-6 py-3 rounded-2xl flex items-center gap-6 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest border-r border-amber-500/20 pr-6">
                  <Brain className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-100">Cortex Active</span>
              </div>
              
              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload PDF to generate graph"
                 >
                     <FileText className="w-4 h-4 text-amber-500" />
                     <span>PDF Uplink</span>
                 </button>
              </div>
          </div>
      </div>

      {/* Minimalistic Mode Selection Modal */}
      {showModeSelect && (
          <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="w-full max-w-4xl px-8">
                  {/* Modal Container */}
                  <div className="relative bg-[#050508] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                      {/* Background Accents */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                      <button 
                        onClick={() => setShowModeSelect(false)}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                      >
                          <X className="w-6 h-6" />
                      </button>

                      <div className="flex items-center gap-3 mb-2">
                          <BrainCircuit className="w-5 h-5 text-amber-500" />
                          <span className="text-xs font-mono text-amber-500 uppercase tracking-[0.2em]">Cortex Protocol</span>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-white mb-2">Initialize Synthesis</h2>
                      <p className="text-slate-400 text-sm mb-10 max-w-xl">
                          Select the analysis depth for your document. The Cortex will extract concepts, identify relationships, and construct a 3D knowledge graph.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Flash Mode */}
                          <button 
                            onClick={() => processPdf('flash')}
                            className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-300 text-left overflow-hidden"
                          >
                              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
                              </div>
                              
                              <div className="mb-4 w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                                  <Zap className="w-6 h-6" />
                              </div>
                              
                              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Flash</h3>
                              <div className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-3">Rapid Extraction</div>
                              
                              <p className="text-slate-400 text-xs leading-relaxed">
                                  Generates ~10 high-level concepts. Best for quick summaries and "big picture" visualization.
                              </p>
                          </button>

                          {/* Focus Mode */}
                          <button 
                            onClick={() => processPdf('focus')}
                            className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 text-left overflow-hidden"
                          >
                               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                              </div>

                              <div className="mb-4 w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                  <ScanEye className="w-6 h-6" />
                              </div>
                              
                              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">Focus</h3>
                              <div className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-wider mb-3">Balanced Analysis</div>
                              
                              <p className="text-slate-400 text-xs leading-relaxed">
                                  Generates ~30 nodes. Identifies key components and meaningful substructures. The balanced choice.
                              </p>
                          </button>

                          {/* Insight Mode */}
                          <button 
                            onClick={() => processPdf('insight')}
                            className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 text-left overflow-hidden"
                          >
                              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                              </div>

                              <div className="mb-4 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                  <Microscope className="w-6 h-6" />
                              </div>
                              
                              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Insight</h3>
                              <div className="text-[10px] font-mono text-purple-500/70 uppercase tracking-wider mb-3">Deep Learning</div>
                              
                              <p className="text-slate-400 text-xs leading-relaxed">
                                  Generates ~50 detailed nodes. Maps the full conceptual landscape including edge cases and nuance.
                              </p>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Toast Notification */}
      <div className={`pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast && toastStyle && (
            <div className={`${toastStyle.bg} border text-slate-200 px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-xl`}>
                <div className={`${toastStyle.iconBg} p-1 rounded-full`}>
                    <toastStyle.Icon className={`w-4 h-4 ${toastStyle.iconColor}`} />
                </div>
                <span className="text-sm font-medium">{toast.msg}</span>
            </div>
        )}
      </div>

      {/* Top Search Bar */}
      <div className="pointer-events-auto flex justify-center w-full pt-4">
        <div className="relative group w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <Search className="w-4 h-4" />
            </div>
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cortex..."
                className="block w-full pl-10 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-xl transition-all shadow-lg"
            />
        </div>
      </div>

      {/* Confirmation Modal - Deletion */}
      {nodeToDelete && (
          <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0c] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] transform transition-all scale-100">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-xl font-bold text-white">Delete Thought?</h2>
                    <p className="text-slate-400 text-sm">
                        Are you sure you want to remove <span className="text-white font-semibold">"{nodeToDelete.title}"</span>? 
                        This will also sever all {nodeToDelete.connections.length} connected synapses.
                    </p>

                    <div className="flex gap-3 w-full mt-4">
                        <button 
                            onClick={onCancelDelete}
                            className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors border border-white/5"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirmDelete}
                            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Confirmation Modal - RESET UNIVERSE */}
      {showResetConfirm && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0a0a0c] border border-red-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.3)] border-t-4 border-t-red-600">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <Radiation className="w-10 h-10 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white tracking-tight">Initiate Entropy?</h2>
                    <p className="text-slate-400 text-sm leading-relaxed px-4">
                        This will trigger total neural decay. All thoughts, connections, and memories will be <span className="text-red-400 font-semibold">permanently erased</span> and the universe will be reborn.
                        <br/><br/>
                        This action cannot be undone.
                    </p>

                    <div className="flex gap-4 w-full mt-8 items-center justify-center">
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-[2] py-4 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl"
                        >
                            CANCEL
                        </button>
                        
                        <button 
                            onClick={() => {
                                setShowResetConfirm(false);
                                onReset();
                            }}
                            className="flex-[1] py-4 rounded-xl bg-transparent border border-red-900/50 text-red-700 hover:text-red-500 hover:border-red-500 font-mono text-xs uppercase tracking-wider transition-colors"
                        >
                            Confirm Decay
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Settings Toggle */}
      <div className="pointer-events-auto absolute bottom-6 left-6 z-20 flex gap-4">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(79,209,197,0.2)]
            ${isOpen ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-black/40 border-white/10 text-cyan-400 hover:bg-black/60 hover:text-white'}
           `}
           title="Settings, API Key, Import/Export"
         >
            {isOpen ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
         </button>
         
         <button 
           onClick={() => setShowHelp(true)}
           className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:bg-black/60 hover:text-white transition-all"
           title="Controls & Help"
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
            title={isDeleteMode ? "Exit Delete Mode" : "Delete Mode (Click to toggle)"}
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
            title="Synapse Mode (Link Nodes)"
         >
            <Network className="w-5 h-5" />
         </button>

         <button 
            onClick={handleEnhancedToggle}
            className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all ${
                isEnhancedMode
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]' 
                : 'bg-black/40 border-white/10 text-amber-500 hover:bg-amber-500/20'
            }`}
            title={isEnhancedMode ? "Disable Enhanced Cortex" : "Enable Enhanced Cortex (Requires API Key)"}
         >
            <Brain className="w-6 h-6" />
         </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-2">NeuroFlow Controls</h2>
                <p className="text-slate-400 text-sm mb-6">Navigate your knowledge graph in 3D space.</p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                        <MousePointer2 className="w-6 h-6 text-cyan-400" />
                        <div>
                            <div className="text-white font-semibold text-sm">Rotate View</div>
                            <div className="text-slate-500 text-xs">Left Click + Drag</div>
                        </div>
                    </div>
                    {/* ... other help items ... */}
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                        <BrainCircuit className="w-6 h-6 text-pink-400" />
                        <div>
                            <div className="text-white font-semibold text-sm">Gemini AI Uplink</div>
                            <div className="text-slate-500 text-xs">Enter your API Key in Settings to enable AI synthesis.</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        <Brain className="w-6 h-6 text-amber-500" />
                        <div>
                            <div className="text-white font-semibold text-sm">Enhanced Cortex</div>
                            <div className="text-slate-500 text-xs">Toggle the Brain icon to enable generative AI features.</div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <button 
                        onClick={() => setShowHelp(false)}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Footer / Controls - Collapsible */}
      <div className={`pointer-events-auto absolute bottom-24 left-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom-left ${
          isOpen ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-8 pointer-events-none'
      }`}>
        <footer className="w-80 bg-[#050508]/95 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <div className="flex items-center gap-2 text-white/90">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">System Status</span>
                     </div>
                </div>

                {/* AI Configuration Section */}
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
                     <p className="text-[9px] text-slate-600 px-1">
                        Required for PDF analysis, synthesis, and entropy features. stored locally.
                     </p>
                </div>

                {/* Stats */}
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

                {/* Physics Slider */}
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

                {/* Data Protocol Section */}
                <div className="pt-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 pl-1">Data Protocols</div>
                    <div className="space-y-3">
                        <button onClick={handleShare} className="group relative w-full flex items-center justify-between px-4 py-3 bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/30 hover:border-cyan-500/50 rounded-xl transition-all duration-300 shadow-lg">
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
                            <button onClick={handleExport} className={actionBtnClass}>
                                <Download className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors relative z-10" />
                                <span className="text-[9px] font-bold text-slate-300 group-hover:text-amber-200 tracking-wider relative z-10 uppercase">Export JSON</span>
                            </button>
                            <button onClick={handleImportClick} className={actionBtnClass}>
                                <Upload className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors relative z-10" />
                                <span className="text-[9px] font-bold text-slate-300 group-hover:text-emerald-200 tracking-wider relative z-10 uppercase">Import JSON</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Ops */}
                <div className="pt-2 border-t border-white/5">
                    <div className="flex gap-2">
                        <button onClick={() => { onLoadDemo(); setIsOpen(false); }} className={`${actionBtnClass} flex-row py-3 flex-1 h-auto shadow-none`}>
                            <RefreshCw className="w-3 h-3 text-slate-300 group-hover:text-blue-400 transition-all relative z-10" />
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-blue-200 tracking-wider relative z-10 uppercase">Load Demo</span>
                        </button>
                        <div className="w-px bg-white/10 my-1"></div>
                        <button onClick={() => setShowResetConfirm(true)} className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors group">
                            <Radiation className="w-3 h-3 group-hover:animate-pulse" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Reset</span>
                        </button>
                    </div>
                </div>

            </div>
        </footer>
      </div>
    </div>
  );
};