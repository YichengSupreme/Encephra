import React, { useState, Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { NetworkGraph } from './components/NetworkGraph';
import { UIOverlay } from './components/UIOverlay';
import { NotePanel } from './components/NotePanel';
import { NodeData } from './types';
import { useGraphData } from './hooks/useGraphData';
import { useGemini } from './hooks/useGemini';
import { geminiService } from './services/GeminiService';

const App: React.FC = () => {
  // Use Custom Hook for Data Logic
  const {
    nodes, links, tagColors, nodeCount, clusterStrength, isResetting, setClusterStrength,
    addNode, updateNode, removeNode, toggleConnection, updateTagColor, importData, startReset, loadDemo,
    injectGraphCluster, injectResearchUniverse, spawnBridgeNode, resolveBridgeNode, spawnGhostNodes, materializeGhostNode, removeGhostNodes,
    startMaterialization, revertMaterialization
  } = useGraphData();

  // Use Gemini Hook
  const { apiKey, updateApiKey } = useGemini();

  // View & Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<'title' | 'tag'>('title');
  
  // Modes
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<number | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);
  
  // Engram Mode State
  const [isEngramMode, setIsEngramMode] = useState(false);
  const [engramSelection, setEngramSelection] = useState<Set<number>>(new Set());
  const [engramResult, setEngramResult] = useState<{ title: string, summary: string } | null>(null);

  // Inference Mode State (Gap Analysis)
  const [isInferenceMode, setIsInferenceMode] = useState(false);
  const [inferenceSelection, setInferenceSelection] = useState<Set<number>>(new Set());

  // Entropy Mode State
  const [isEntropyMode, setIsEntropyMode] = useState(false);
  const [entropySelection, setEntropySelection] = useState<Set<number>>(new Set());

  // Deletion Modal UI State
  const [nodeToDelete, setNodeToDelete] = useState<NodeData | null>(null);

  // --- Handlers ---
  const handleStartReset = () => { setSelectedNodeId(null); startReset(); };
  const handleAddNode = () => { const newId = addNode(selectedNodeId); setSelectedNodeId(newId); };

  const handleImportData = (data: any) => {
    importData(data);
    setSelectedNodeId(null); setLinkSourceId(null);
    setIsLinkMode(false); setIsDeleteMode(false); setIsEngramMode(false); setIsInferenceMode(false); setIsEntropyMode(false);
    setEngramSelection(new Set()); setInferenceSelection(new Set()); setEntropySelection(new Set());
  };

  // Toggle Helpers
  const resetModes = () => {
      setIsLinkMode(false); setLinkSourceId(null);
      setIsDeleteMode(false);
      setIsEngramMode(false); setEngramSelection(new Set()); setEngramResult(null);
      // NOTE: inferenceMode handled in toggle logic to clean ghosts
      setIsInferenceMode(false); setInferenceSelection(new Set());
      setIsEntropyMode(false); setEntropySelection(new Set());
      setSelectedNodeId(null);
  };

  const toggleDeleteMode = () => { const m = !isDeleteMode; resetModes(); setIsDeleteMode(m); };
  const toggleLinkMode = () => { const m = !isLinkMode; resetModes(); setIsLinkMode(m); };
  const toggleEngramMode = () => { const m = !isEngramMode; resetModes(); setIsEngramMode(m); };
  
  const toggleInferenceMode = () => { 
      const m = !isInferenceMode; 
      if (!m) {
          // Turning OFF -> Cleanup Ghost Nodes
          removeGhostNodes();
      }
      resetModes(); 
      setIsInferenceMode(m); 
  };
  
  const toggleEntropyMode = () => { const m = !isEntropyMode; resetModes(); setIsEntropyMode(m); };
  const toggleEnhancedMode = () => { setIsEnhancedMode(!isEnhancedMode); if (!isEnhancedMode) setIsDeleteMode(false); };

  const runGapAnalysis = async () => {
      if (inferenceSelection.size === 0) return;
      const contextNodes = nodes.filter(n => inferenceSelection.has(n.id));
      const result = await geminiService.analyzeGaps(contextNodes);
      if (result && Array.isArray(result.ghostNodes)) {
          spawnGhostNodes(result.ghostNodes, contextNodes);
      }
      // Note: We keep Inference Mode ON so user can see and interact with ghosts
  };

  const initiateEntropyCollision = async () => {
      if (entropySelection.size !== 2) return;
      const ids = Array.from(entropySelection);
      const sourceId = ids[0];
      const targetId = ids[1];
      
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);

      // Reset UI state immediately
      setIsEntropyMode(false);
      setEntropySelection(new Set());

      if (sourceNode && targetNode && apiKey) {
          if (!sourceNode.position || !targetNode.position) {
              console.error("Missing position data for entropy collision");
              return;
          }
          const bridgeId = spawnBridgeNode(sourceId, targetId);
          if (bridgeId !== null) {
               // Fix: Manually calculate midPos because 'nodes' state hasn't updated yet to contain the new bridge node.
               // We must provide the position to avoid updating the node with undefined position.
               const midPos = sourceNode.position.clone().add(targetNode.position).multiplyScalar(0.5);

               // Update to Entropy Status immediately with a COMPLETE object
               const entropyNode: NodeData = {
                   id: bridgeId,
                   position: midPos,
                   connections: [sourceId, targetId],
                   activity: 0,
                   title: "COLLIDING...",
                   content: "Entropy synthesis in progress...",
                   category: 'concept',
                   tags: ['_status_entropy'], // Triggers Gravity Well
                   created_at: new Date().toISOString()
               };

               updateNode(entropyNode);

               try {
                   const entropyData = await geminiService.synthesizeEntropy(sourceNode, targetNode);
                   // CRITICAL FIX: Do NOT include _status_entropy in the final tags.
                   // This allows the physics engine to stop the "gravity well" effect.
                   const finalTags = entropyData.tags || []; 
                   resolveBridgeNode(bridgeId, { ...entropyData, tags: finalTags });
               } catch (e) {
                   resolveBridgeNode(bridgeId, { title: "Entropy Fail", content: "Dissipated.", tags: ["error"] });
               }
          }
      }
  };

  const confirmDeleteNode = () => { if (nodeToDelete) { removeNode(nodeToDelete.id); setNodeToDelete(null); setIsDeleteMode(false); } };
  const handleGraphNodeClick = useCallback(async (clickedId: number) => {
    const clickedNode = nodes.find(n => n.id === clickedId);
    
    if (clickedNode && clickedNode.isGhost) {
        // 1. Persist the node immediately so it survives mode exit
        startMaterialization(clickedId);

        try {
            const contextNodes = nodes.filter(n => clickedNode.connections.includes(n.id) && !n.isGhost);
            const materialData = await geminiService.materializeGhost(clickedNode.title, contextNodes);
            materializeGhostNode(clickedId, materialData);
            setSelectedNodeId(clickedId);
        } catch (e) { 
            console.error("Materialization Failed:", e);
            // CRITICAL FIX: Revert the visual state if API fails, so user can try again
            revertMaterialization(clickedId);
        }
        return;
    }

    if (isDeleteMode) { setNodeToDelete(clickedNode || null); return; }

    if (isEngramMode) {
        setEngramSelection(prev => {
            const next = new Set(prev);
            next.has(clickedId) ? next.delete(clickedId) : next.add(clickedId);
            return next;
        });
        return;
    }

    if (isInferenceMode) {
        setInferenceSelection(prev => {
            const next = new Set(prev);
            next.has(clickedId) ? next.delete(clickedId) : next.add(clickedId);
            return next;
        });
        return;
    }

    if (isEntropyMode) {
        setEntropySelection(prev => {
            const next = new Set(prev);
            if (next.has(clickedId)) {
                next.delete(clickedId);
            } else {
                if (next.size < 2) next.add(clickedId);
                // else: maybe toast "Max 2 nodes for collision"
            }
            return next;
        });
        return;
    }

    if (isLinkMode) {
        if (linkSourceId === null) {
            setLinkSourceId(clickedId);
        } else {
            const sourceId = linkSourceId;
            const targetId = clickedId;
            setLinkSourceId(null); setIsLinkMode(false); 
            if (isEnhancedMode && apiKey) {
                const sourceNode = nodes.find(n => n.id === sourceId);
                const targetNode = nodes.find(n => n.id === targetId);
                if (sourceNode && targetNode && sourceId !== targetId) {
                     const bridgeId = spawnBridgeNode(sourceId, targetId);
                     if (bridgeId !== null) {
                         geminiService.synthesizeConnection(sourceNode, targetNode)
                             .then(data => resolveBridgeNode(bridgeId, data))
                             .catch(() => resolveBridgeNode(bridgeId, { title: "Error", content: "Failed", tags: [] }));
                     }
                }
            } else {
                // TOGGLE CONNECTION: Adds if missing, removes if exists
                toggleConnection(sourceId, targetId);
            }
        }
    } else {
        setSelectedNodeId(clickedId);
    }
  }, [isDeleteMode, isLinkMode, isEngramMode, isInferenceMode, isEntropyMode, linkSourceId, isEnhancedMode, apiKey, nodes, spawnBridgeNode, resolveBridgeNode, materializeGhostNode, toggleConnection, startMaterialization, revertMaterialization]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const sourceNode = useMemo(() => linkSourceId !== null ? nodes.find(n => n.id === linkSourceId) || null : null, [nodes, linkSourceId]);
  const hoveredNode = useMemo(() => hoveredNodeId !== null ? nodes.find(n => n.id === hoveredNodeId) || null : null, [nodes, hoveredNodeId]);

  return (
    <div className="relative w-full h-screen bg-[#020204] overflow-hidden selection:bg-cyan-500/30 flex flex-col md:flex-row">
      {/* 
        Responsive Layout Strategy:
        - Mobile: Canvas is always full width. Panel is a fixed overlay.
        - Desktop (md): Canvas flex-shrinks when panel opens. Panel is relative side-by-side.
      */}
      <div className={`relative h-full transition-all duration-500 ease-in-out z-0 
        ${selectedNodeId !== null ? 'w-full md:w-[calc(100vw-500px)]' : 'w-full'}
      `}>
        <Canvas camera={{ position: [0, 0, 35], fov: 60 }} gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }} dpr={[1, 2]}>
          <color attach="background" args={['#020204']} />
          <ambientLight intensity={0.2} color="#4fd1c5" />
          <pointLight position={[0, 0, 0]} intensity={2} color="#4fd1c5" distance={30} />
          <Stars radius={150} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          <Suspense fallback={null}>
            <NetworkGraph 
              nodes={nodes} links={links} selectedNodeId={selectedNodeId} onNodeClick={handleGraphNodeClick}
              searchQuery={searchQuery} searchMode={searchMode} tagColors={tagColors} clusterStrength={clusterStrength}
              isLinkMode={isLinkMode} linkSourceId={linkSourceId} isDeleteMode={isDeleteMode} onHoverNode={setHoveredNodeId}
              isEngramMode={isEngramMode} engramSelection={engramSelection}
              isInferenceMode={isInferenceMode} inferenceSelection={inferenceSelection}
              isEntropyMode={isEntropyMode} entropySelection={entropySelection}
            />
          </Suspense>
          <OrbitControls makeDefault enablePan enableZoom enableRotate autoRotate={false} dampingFactor={0.05} />
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.6} />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.3} darkness={0.8} />
          </EffectComposer>
        </Canvas>

        <div className="absolute inset-0 pointer-events-none">
          <UIOverlay 
            nodeCount={nodes.length} linkCount={links.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchMode={searchMode} setSearchMode={setSearchMode} clusterStrength={clusterStrength} setClusterStrength={setClusterStrength}
            onReset={handleStartReset} onLoadDemo={loadDemo} onAddNode={handleAddNode}
            onToggleDeleteMode={toggleDeleteMode} isDeleteMode={isDeleteMode} isLinkMode={isLinkMode} onToggleLinkMode={toggleLinkMode}
            nodeToDelete={nodeToDelete} onConfirmDelete={confirmDeleteNode} onCancelDelete={() => setNodeToDelete(null)}
            nodes={nodes} links={links} tagColors={tagColors} onImport={handleImportData}
            apiKey={apiKey} onSetApiKey={updateApiKey} isEnhancedMode={isEnhancedMode} onToggleEnhancedMode={toggleEnhancedMode} onInjectCluster={injectGraphCluster} onInjectResearch={injectResearchUniverse}
            hoveredNode={hoveredNode} sourceNode={sourceNode} isEngramMode={isEngramMode} onToggleEngramMode={toggleEngramMode}
            engramSelection={engramSelection} engramResult={engramResult} setEngramResult={setEngramResult}
            isInferenceMode={isInferenceMode} onToggleInferenceMode={toggleInferenceMode} inferenceSelection={inferenceSelection} setInferenceSelection={setInferenceSelection} onRunGapAnalysis={runGapAnalysis}
            isEntropyMode={isEntropyMode} onToggleEntropyMode={toggleEntropyMode} entropySelection={entropySelection} onInitiateCollision={initiateEntropyCollision}
          />
        </div>
      </div>

      <div className={`
        fixed inset-0 z-50 bg-black/90 backdrop-blur-3xl transition-all duration-500 ease-in-out
        md:relative md:inset-auto md:bg-black/60 md:backdrop-blur-2xl md:border-l md:border-white/10 md:z-40 md:h-full
        ${selectedNodeId !== null 
          ? 'translate-x-0 opacity-100 md:w-[500px]' 
          : 'translate-x-full opacity-0 md:w-0 md:overflow-hidden'
        }
      `}>
          {selectedNodeId !== null && (
            <NotePanel 
              node={selectedNode} 
              allNodes={nodes} 
              onClose={() => setSelectedNodeId(null)} 
              onUpdate={updateNode} 
              tagColors={tagColors} 
              onTagColorChange={updateTagColor} 
              onToggleConnection={toggleConnection}
            />
          )}
      </div>
    </div>
  );
};

export default App;