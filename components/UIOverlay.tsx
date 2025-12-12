import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, BrainCircuit, Check, X, FileText, MousePointer2, Radar, Radiation, Zap, Brain, Hand, ZoomIn, Network, FlaskConical, Eye, Fingerprint, Settings2, Plus, Minus } from 'lucide-react';
import { NodeData, LinkData } from '../types';
import { geminiService } from '../services/GeminiService';
import { stringToColor } from './SceneComponents';
import { CortexToolbar, EnhancedToolbar } from './ui/CortexToolbar';
import { SettingsPanel } from './ui/SettingsPanel';
import { SearchWidget } from './ui/SearchWidget';
import { EngramHUD, InferenceHUD, EntropyHUD } from './ui/ModePanels';
import { ResearchDock } from './ui/ResearchDock';
import { EncodeDock } from './ui/EncodeDock';
import { VisionDock } from './ui/VisionDock';

interface UIOverlayProps {
  nodeCount: number;
  linkCount: number;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  searchMode: 'title' | 'tag';
  setSearchMode: (mode: 'title' | 'tag') => void;
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
  onInjectResearch: (data: any) => void;
  // Link Mode UI
  hoveredNode: NodeData | null;
  sourceNode: NodeData | null;
  // Engram Props
  isEngramMode: boolean;
  onToggleEngramMode: () => void;
  engramSelection: Set<number>;
  engramResult: { title: string, summary: string } | null;
  setEngramResult: (res: any) => void;
  // Inference Props
  isInferenceMode: boolean;
  onToggleInferenceMode: () => void;
  inferenceSelection: Set<number>;
  setInferenceSelection: (s: Set<number>) => void;
  onRunGapAnalysis: () => void;
  // Entropy Props
  isEntropyMode: boolean;
  onToggleEntropyMode: () => void;
  entropySelection: Set<number>;
  onInitiateCollision: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  nodeCount, linkCount, searchQuery, setSearchQuery, searchMode, setSearchMode,
  clusterStrength, setClusterStrength, onReset, onLoadDemo, onAddNode,
  onToggleDeleteMode, isDeleteMode, isLinkMode, onToggleLinkMode,
  nodeToDelete, onConfirmDelete, onCancelDelete, nodes, links, tagColors, onImport,
  apiKey, onSetApiKey, isEnhancedMode, onToggleEnhancedMode, onInjectCluster, onInjectResearch,
  hoveredNode, sourceNode, isEngramMode, onToggleEngramMode, engramSelection,
  engramResult, setEngramResult, isInferenceMode, onToggleInferenceMode,
  inferenceSelection, setInferenceSelection, onRunGapAnalysis,
  isEntropyMode, onToggleEntropyMode, entropySelection, onInitiateCollision
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'info' | 'warning'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  // Docks State
  const [showEncodeDock, setShowEncodeDock] = useState(false);
  const [showResearchDock, setShowResearchDock] = useState(false);
  const [showVisionDock, setShowVisionDock] = useState(false);
  
  // HUD State
  const [engramDepth, setEngramDepth] = useState<'trace' | 'engram' | 'consolidation'>('trace');
  const [displayedSummary, setDisplayedSummary] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const [showTagSelect, setShowTagSelect] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Derived state for unique tags
  const uniqueTags = React.useMemo(() => Array.from(new Set(nodes.flatMap(n => n.tags) as string[])).sort(), [nodes]);

  // Loading animation
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

  // Typewriter effect
  useEffect(() => {
      if (engramResult && engramResult.summary) {
          setDisplayedSummary(""); // Clear immediately
          const text = engramResult.summary;
          let currentIndex = 0;
          
          const interval = setInterval(() => {
             currentIndex++;
             setDisplayedSummary(text.substring(0, currentIndex));
             
             if (currentIndex >= text.length) {
                 clearInterval(interval);
             }
             
             if (summaryRef.current) {
                 summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
             }
          }, 20);
          
          return () => clearInterval(interval);
      }
  }, [engramResult]);

  // Handlers
  const handleShare = () => {
    if (window.location.protocol === 'file:') {
        setToast({ msg: "Cannot share local link!", type: "warning" });
        setTimeout(() => setToast(null), 6000);
        return;
    }
    navigator.clipboard.writeText(window.location.href);
    setToast({ msg: "Link copied!", type: "success" });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = () => {
    try {
        const data = { nodes, links, tagColors, config: { nodeCount, clusterStrength }, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `neuroflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ msg: "Universe exported.", type: 'success' });
        setTimeout(() => setToast(null), 3000);
    } catch (e) {
        setToast({ msg: "Export failed.", type: 'warning' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              onImport(json);
              setToast({ msg: "Imported successfully.", type: 'success' });
              setTimeout(() => setToast(null), 3000);
              setIsOpen(false);
          } catch (err) {
              setToast({ msg: "Failed to read file.", type: 'warning' });
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  // Safe Mode Toggle for Cortex
  const handleEnhancedToggle = () => {
    if (!apiKey && !isEnhancedMode) {
        setToast({ msg: "Gemini API Key required to activate Cortex.", type: 'warning' });
        setTimeout(() => setToast(null), 3000);
        setIsOpen(true);
        return;
    }
    onToggleEnhancedMode();
  };

  const handleEngramGeneration = async () => {
      setIsProcessing(true);
      setEngramResult(null);
      try {
          const selectedNodes = nodes.filter(n => engramSelection.has(n.id));
          const result = await geminiService.generateEngram(selectedNodes, engramDepth);
          setEngramResult(result);
          setToast({ msg: "Engram Synthesized.", type: 'success' });
      } catch (e) {
          setToast({ msg: "Failed.", type: 'warning' });
      } finally {
          setIsProcessing(false);
          setTimeout(() => setToast(null), 3000);
      }
  };

  const handleGapAnalysis = async () => {
      setIsProcessing(true);
      try {
          await onRunGapAnalysis();
          setToast({ msg: "Gap Analysis Complete.", type: 'success' });
      } catch (e) {
          setToast({ msg: "Inference Failed.", type: 'warning' });
      } finally {
          setIsProcessing(false);
          setTimeout(() => setToast(null), 4000);
      }
  };

  // Occipital (Vision) Processing Handler
  const handleVisionAnalysis = async (file: File) => {
      setShowVisionDock(false);
      setIsProcessing(true);
      setLoadingText(" (VISUAL CORTEX)");
      
      try {
          const reader = new FileReader();
          reader.onload = async (event) => {
              const raw = event.target?.result as string;
              const base64 = raw.split(',')[1];
              try {
                  const graphData = await geminiService.analyzeVisualGraph(base64, file.type);
                  onInjectCluster(graphData);
                  setToast({ msg: "Occipital Analysis Complete.", type: 'success' });
              } catch (err) {
                  setToast({ msg: "Vision Analysis Failed.", type: 'warning' });
              } finally {
                  setIsProcessing(false);
                  setTimeout(() => setToast(null), 4000);
              }
          };
          reader.readAsDataURL(file);
      } catch (e) {
          setIsProcessing(false);
          setToast({ msg: "Read Error.", type: 'warning' });
      }
  };

  // Unified Processing Handler for PDFs
  const handleEncodeProcessing = async (file: File, mode: 'flash' | 'focus' | 'insight') => {
      setShowEncodeDock(false);
      setIsProcessing(true);
      setLoadingText(" (TEXT ENCODING)");
      try {
          const reader = new FileReader();
          reader.onload = async (e) => {
             const base64Raw = e.target?.result as string;
             const base64Data = base64Raw.split(',')[1];
             try {
                 const graphData = await geminiService.processDocument(base64Data, 'application/pdf', mode);
                 onInjectCluster(graphData);
                 setToast({ msg: "Graph Expanded.", type: 'success' });
             } catch (err) {
                 setToast({ msg: "Synthesis Failed.", type: 'warning' });
             } finally {
                 setIsProcessing(false);
                 setTimeout(() => setToast(null), 4000);
             }
          };
          reader.readAsDataURL(file);
      } catch (e) {
          setIsProcessing(false);
          setToast({ msg: "Read Error.", type: 'warning' });
      }
  };

  const getPrimaryColor = (node: NodeData) => {
      if (node.isGhost) return '#f43f5e';
      const tag = node.tags[0] || 'default';
      return tagColors[tag.toLowerCase()] || stringToColor(tag);
  };

  let leftColor = '#f59e0b';
  let rightColor = '#f59e0b';
  let statusText = "";
  let nodeAText = "";
  let nodeBText = "";

  if (isLinkMode) {
      statusText = "INTERNEURON";
      leftColor = sourceNode ? getPrimaryColor(sourceNode) : (hoveredNode ? getPrimaryColor(hoveredNode) : '#f59e0b');
      rightColor = (sourceNode && hoveredNode) ? getPrimaryColor(hoveredNode) : '#f59e0b';
      
      nodeAText = sourceNode ? sourceNode.title : (hoveredNode?.title || "");
      nodeBText = sourceNode ? (hoveredNode?.title || "") : "";

  } else if (isEntropyMode) {
      statusText = "ENTROPY";
      leftColor = '#f59e0b';
      rightColor = '#f59e0b';
      
      const entropyIds = Array.from(entropySelection);
      const selectedNodeA = entropyIds.length > 0 ? nodes.find(n => n.id === entropyIds[0]) : null;
      const selectedNodeB = entropyIds.length > 1 ? nodes.find(n => n.id === entropyIds[1]) : null;

      if (selectedNodeA) {
          nodeAText = selectedNodeA.title;
          leftColor = getPrimaryColor(selectedNodeA);
          
          if (selectedNodeB) {
               nodeBText = selectedNodeB.title;
               rightColor = getPrimaryColor(selectedNodeB);
          } else {
               nodeBText = hoveredNode ? hoveredNode.title : "";
               rightColor = hoveredNode ? getPrimaryColor(hoveredNode) : '#f59e0b';
          }
      } else {
          nodeAText = hoveredNode ? hoveredNode.title : "";
          leftColor = hoveredNode ? getPrimaryColor(hoveredNode) : '#f59e0b';
      }
  }

  // Toast Styles
  const getToastStyles = (type: string) => {
    switch(type) {
        case 'warning': return { bg: 'bg-[#0a0a0c] border-yellow-500/30', iconBg: 'bg-yellow-500/20', iconColor: 'text-yellow-400', Icon: AlertTriangle };
        case 'info': return { bg: 'bg-[#0a0a0c] border-amber-500/30', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', Icon: BrainCircuit };
        default: return { bg: 'bg-[#0a0a0c] border-cyan-500/30', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', Icon: Check };
    }
  };
  const toastStyle = toast ? getToastStyles(toast.type) : null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6">
                <BrainCircuit className="w-12 h-12 text-amber-500 animate-pulse" />
                <div className="text-amber-500 font-mono text-lg tracking-[0.2em] font-bold">UPLINKING{loadingText}</div>
            </div>
        </div>
      )}

      <SearchWidget searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchMode={searchMode} setSearchMode={setSearchMode} />

      {/* Terminal Overlay - Responsive Positioning */}
      <div className={`pointer-events-auto absolute top-20 left-4 md:top-auto md:bottom-48 md:left-8 z-40 transition-all duration-300 ${(isLinkMode || isEntropyMode || hoveredNode) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
          {(isLinkMode || isEntropyMode) ? (
            <div className={`font-mono flex flex-col items-start ${isEntropyMode ? 'drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                <div className={`mb-2 text-[10px] tracking-[0.2em] font-bold uppercase text-amber-500`}>// {statusText}</div>
                <div className="flex flex-col mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">NODE A_</span>
                    <span className="text-xl font-bold uppercase tracking-widest" style={{ color: leftColor }}>
                        {nodeAText}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">NODE B_</span>
                    <span className="text-xl font-bold uppercase tracking-widest" style={{ color: rightColor }}>
                        {nodeBText}
                    </span>
                </div>
            </div>
          ) : hoveredNode ? (
            <div className="font-mono flex flex-col items-start" style={{ filter: `drop-shadow(0 0 15px ${getPrimaryColor(hoveredNode)}40)` }}>
                <div className="mb-2 text-[10px] tracking-[0.2em] font-bold uppercase flex items-center gap-2">
                    {hoveredNode.isGhost ? <span className="text-red-400">// GHOST SIGNAL</span> : <span className="text-slate-500">// SIGNAL DETECTED</span>}
                </div>
                <div className="text-xl font-bold uppercase tracking-widest" style={{ color: getPrimaryColor(hoveredNode) }}>{hoveredNode.title}</div>
            </div>
          ) : null}
      </div>

      {/* Mode HUDs */}
      {isEngramMode && (
          <EngramHUD 
             nodes={nodes} selection={engramSelection} depth={engramDepth} setDepth={setEngramDepth}
             onGenerate={handleEngramGeneration} isProcessing={isProcessing} result={engramResult}
             displayedSummary={displayedSummary} summaryRef={summaryRef} onSave={() => setToast({msg: "Saved", type: 'success'})}
          />
      )}
      {isInferenceMode && (
          <InferenceHUD
             selectionCount={inferenceSelection.size} onSelectAll={() => setInferenceSelection(new Set(nodes.map(n => n.id)))}
             onClear={() => setInferenceSelection(new Set())} onGenerate={handleGapAnalysis} isProcessing={isProcessing}
             tagColors={tagColors} uniqueTags={uniqueTags} showTagSelect={showTagSelect} setShowTagSelect={setShowTagSelect}
             onSelectByTag={(tag) => {
                 setInferenceSelection(new Set(nodes.filter(n => n.tags.includes(tag)).map(n => n.id)));
                 setShowTagSelect(false);
             }}
          />
      )}
      {isEntropyMode && (
          <EntropyHUD selectionCount={entropySelection.size} onInitiate={onInitiateCollision} />
      )}

      {/* Floating Toolbar for Enhanced Mode */}
      <EnhancedToolbar 
         isEnhancedMode={isEnhancedMode} isLinkMode={isLinkMode} isEntropyMode={isEntropyMode}
         isEngramMode={isEngramMode} isInferenceMode={isInferenceMode}
         onToggleLinkMode={onToggleLinkMode} onToggleEntropyMode={onToggleEntropyMode}
         onToggleEngramMode={onToggleEngramMode} onToggleInferenceMode={onToggleInferenceMode}
         onPdfUpload={() => setShowEncodeDock(true)}
         onImageUpload={() => setShowVisionDock(true)}
         onOpenResearch={() => setShowResearchDock(true)}
         engramCount={engramSelection.size} inferenceCount={inferenceSelection.size} isProcessing={isProcessing}
      />

      {/* Research Dock Modal */}
      {showResearchDock && (
          <ResearchDock 
              onClose={() => setShowResearchDock(false)} 
              onSynthesize={(data) => {
                  onInjectResearch(data);
                  setToast({ msg: "Research Universe Synthesized", type: "success" });
                  setTimeout(() => setToast(null), 3000);
              }} 
          />
      )}

      {/* Encode Dock Modal */}
      {showEncodeDock && (
          <EncodeDock 
              onClose={() => setShowEncodeDock(false)}
              onProcess={handleEncodeProcessing}
          />
      )}

      {/* Vision Dock Modal */}
      {showVisionDock && (
          <VisionDock 
              onClose={() => setShowVisionDock(false)}
              onAnalyze={handleVisionAnalysis}
          />
      )}

      {/* Toast */}
      <div className={`pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast && toastStyle && (
            <div className={`${toastStyle.bg} border text-slate-200 px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-xl`}>
                <div className={`${toastStyle.iconBg} p-1 rounded-full`}><toastStyle.Icon className={`w-4 h-4 ${toastStyle.iconColor}`} /></div>
                <span className="text-sm font-medium">{toast.msg}</span>
            </div>
        )}
      </div>

      {/* Settings Panel & Footer - Centered on Mobile */}
      <SettingsPanel 
         isOpen={isOpen} onClose={() => setIsOpen(false)} apiKey={apiKey} onSetApiKey={onSetApiKey}
         nodeCount={nodeCount} linkCount={linkCount} clusterStrength={clusterStrength} setClusterStrength={setClusterStrength}
         onShare={handleShare} onExport={handleExport} onImportClick={() => fileInputRef.current?.click()}
         onLoadDemo={onLoadDemo} onResetClick={() => setShowResetConfirm(true)}
      />

      {/* Cortex Toolbar (Bottom Left on Desktop, Center on Mobile) */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-20 w-max">
         <CortexToolbar 
            isOpen={isOpen} setIsOpen={setIsOpen} setShowHelp={setShowHelp} onAddNode={onAddNode}
            isDeleteMode={isDeleteMode} onToggleDeleteMode={onToggleDeleteMode}
            isLinkMode={isLinkMode} onToggleLinkMode={onToggleLinkMode}
            isEnhancedMode={isEnhancedMode} onToggleEnhancedMode={handleEnhancedToggle} onOpenResearch={() => setShowResearchDock(true)}
            isEntropyMode={isEntropyMode} onToggleEntropyMode={onToggleEntropyMode}
            isEngramMode={isEngramMode} onToggleEngramMode={onToggleEngramMode}
            isInferenceMode={isInferenceMode} onToggleInferenceMode={onToggleInferenceMode}
            hasApiKey={!!apiKey}
         />
      </div>

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-[#0a0a0c] border border-red-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.3)] text-center">
                <Radiation className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-white">Initiate Entropy?</h2>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">CANCEL</button>
                    <button onClick={() => { setShowResetConfirm(false); onReset(); }} className="flex-1 py-4 border border-red-500 text-red-500 font-mono text-xs rounded-xl hover:bg-red-500/20">CONFIRM</button>
                </div>
            </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#050508] border border-cyan-500/20 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                    <div>
                         <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                             <BrainCircuit className="w-6 h-6 text-cyan-400" />
                             System Manual
                         </h2>
                         <p className="text-cyan-400/60 text-xs font-mono uppercase tracking-widest mt-1">Encephra Neural Interface v1.0</p>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-[#050508]">
                     {/* LEFT COLUMN: NAVIGATION & BASICS */}
                     <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                                <MousePointer2 className="w-4 h-4" /> Spatial Navigation
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-slate-300">Rotate View</span>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded">Left Click + Drag</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-slate-300">Pan Camera</span>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded">Right Click + Drag</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-slate-300">Zoom</span>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded">Scroll Wheel</span>
                                </div>
                            </div>
                        </section>

                        <section>
                             <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                                 <Settings2 className="w-4 h-4" /> Command Interface
                             </h3>
                             <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0"><Plus className="w-4 h-4" /></div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-200">Add Node</div>
                                          <div className="text-[10px] text-slate-500">Spawn thought</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0"><Minus className="w-4 h-4" /></div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-200">Delete</div>
                                          <div className="text-[10px] text-slate-500">Remove nodes</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0"><Network className="w-4 h-4" /></div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-200">Synapse</div>
                                          <div className="text-[10px] text-slate-500">Connect / Disconnect</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0"><Brain className="w-4 h-4" /></div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-200">Cortex</div>
                                          <div className="text-[10px] text-slate-500">Toggle AI Mode</div>
                                      </div>
                                  </div>
                             </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Core Interaction
                            </h3>
                            <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                                <p><strong className="text-white">Selection:</strong> Click any node to open the <span className="text-cyan-400">Synaptic Editor</span>. Edit content, drag-and-drop images, or remove connections via the Network list.</p>
                                <p><strong className="text-white">Linking:</strong> Use the <span className="text-purple-400">Synapse</span> tool to connect nodes. Clicking two already linked nodes will disconnect them.</p>
                                <p><strong className="text-white">Physics:</strong> Nodes with similar tags attract each other. Adjust the <span className="text-pink-400">Gravity Well</span> in settings to control cluster density.</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                                <Radar className="w-4 h-4" /> Shapes & Semantics
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                                    <span className="text-xs text-slate-300">Concept (Sphere)</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                                    <div className="w-3 h-3 bg-slate-200"></div>
                                    <span className="text-xs text-slate-300">Source PDF (Cube)</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                                    <div className="w-3 h-3 rotate-45 bg-red-500"></div>
                                    <span className="text-xs text-slate-300">Conflict (Diamond)</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full border border-purple-500"></div>
                                    <span className="text-xs text-slate-300">Theory (Crystal)</span>
                                </div>
                            </div>
                        </section>
                     </div>

                     {/* RIGHT COLUMN: AI FUNCTIONS */}
                     <div className="space-y-8">
                         <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
                            <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Cortex Intelligence
                            </h3>
                            <p className="text-xs text-amber-200/60 leading-relaxed">
                                Requires a Gemini API Key. Click the <Brain className="w-3 h-3 inline mx-1" /> icon in the bottom toolbar to activate Enhanced Mode.
                            </p>
                         </div>

                         <div className="space-y-4">
                            {/* ENCODE */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Encode (Single PDF)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Upload a research paper to generate a knowledge graph. 
                                        Modes: <span className="text-cyan-400">Flash</span> (Skeleton), <span className="text-amber-400">Focus</span> (Balanced), <span className="text-purple-400">Insight</span> (Deep/Explosive).
                                    </p>
                                </div>
                            </div>

                            {/* RESEARCH */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                    <FlaskConical className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Research (Multi-PDF)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Upload up to 5 PDFs. The AI performs a comparative meta-analysis, identifying shared pathways, contradictions (Red Diamonds), and inferred hypotheses (Purple Crystals).
                                    </p>
                                </div>
                            </div>

                            {/* OCCIPITAL */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                                    <Eye className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Occipital (Vision)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Upload an image (diagram, chart, mind map). The AI deconstructs the visual information into a semantic graph structure.
                                    </p>
                                </div>
                            </div>

                            {/* INTERNEURON */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                    <Network className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Interneuron (Bridge)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Select two nodes. The AI synthesizes a "Bridge Concept" that logically connects them, explaining the relationship.
                                    </p>
                                </div>
                            </div>

                            {/* ENTROPY */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Entropy (Collision)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Force a collision between two unrelated concepts. The AI generates a speculative, high-temperature synthesis concept.
                                    </p>
                                </div>
                            </div>

                             {/* INFERENCE */}
                             <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                    <Radar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Inference (Gap Analysis)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Analyzes a selection of nodes to find missing concepts. Spawns "Ghost Nodes" in the negative space. Click a ghost to materialize it.
                                    </p>
                                </div>
                            </div>

                            {/* ENGRAM */}
                            <div className="group flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Fingerprint className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Engram (Memory)</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Select a cluster of nodes. The AI writes a "Trace" (Summary), "Engram" (Deep Dive), or "Consolidation" (Systemic Analysis) of the group.
                                    </p>
                                </div>
                            </div>

                         </div>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {nodeToDelete && (
          <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
                <h2 className="text-xl font-bold text-white mb-4">Delete Thought?</h2>
                <div className="flex gap-3 mt-4">
                    <button onClick={onCancelDelete} className="flex-1 py-2.5 bg-white/5 text-slate-300 rounded-lg">Cancel</button>
                    <button onClick={onConfirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500">Delete</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};