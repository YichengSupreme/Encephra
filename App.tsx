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

const App: React.FC = () => {
  // Use Custom Hook for Data Logic
  const {
    nodes,
    links,
    tagColors,
    nodeCount,
    clusterStrength,
    isResetting,
    setClusterStrength,
    addNode,
    updateNode,
    removeNode,
    addLink,
    updateTagColor,
    importData,
    startReset,
    loadDemo,
    injectGraphCluster
  } = useGraphData();

  // Use Gemini Hook
  const { apiKey, updateApiKey } = useGemini();

  // View & Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modes
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<number | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);
  
  // Deletion Modal UI State
  const [nodeToDelete, setNodeToDelete] = useState<NodeData | null>(null);

  // --- Handlers ---

  const handleStartReset = () => {
     setSelectedNodeId(null);
     startReset();
  };

  const handleAddNode = () => {
    const newId = addNode(selectedNodeId);
    setSelectedNodeId(newId);
  };

  const handleImportData = (data: any) => {
    importData(data);
    // Reset view states
    setSelectedNodeId(null);
    setLinkSourceId(null);
    setIsLinkMode(false);
    setIsDeleteMode(false);
  };

  const toggleDeleteMode = () => {
    const newMode = !isDeleteMode;
    setIsDeleteMode(newMode);
    
    if (newMode) {
        setIsLinkMode(false);
        setLinkSourceId(null);
        setSelectedNodeId(null);
        // Turn off other modes
        setIsEnhancedMode(false);
    }
  };

  const toggleLinkMode = () => {
      const newMode = !isLinkMode;
      setIsLinkMode(newMode);
      setLinkSourceId(null);
      
      if (newMode) {
          setIsDeleteMode(false);
          setSelectedNodeId(null);
      }
  };

  const toggleEnhancedMode = () => {
      const newMode = !isEnhancedMode;
      setIsEnhancedMode(newMode);
      
      if (newMode) {
          // Optional: reset other modes if they conflict, though Overlay handles visibility
          setIsDeleteMode(false);
      }
  };

  const requestDeleteNode = useCallback((id: number) => {
    const target = nodes.find(n => n.id === id);
    if (target) {
        setNodeToDelete(target);
    }
  }, [nodes]);

  const confirmDeleteNode = () => {
    if (!nodeToDelete) return;
    removeNode(nodeToDelete.id);
    setNodeToDelete(null);
    setIsDeleteMode(false); 
  };

  const cancelDeleteNode = () => {
    setNodeToDelete(null);
  };

  const handleGraphNodeClick = useCallback((clickedId: number) => {
    if (isDeleteMode) {
        requestDeleteNode(clickedId);
        return;
    }

    if (isLinkMode) {
        if (linkSourceId === null) {
            setLinkSourceId(clickedId);
        } else {
            addLink(linkSourceId, clickedId);
            setLinkSourceId(null); 
            setIsLinkMode(false); 
        }
    } else {
        setSelectedNodeId(clickedId);
    }
  }, [isDeleteMode, isLinkMode, linkSourceId, requestDeleteNode, addLink]);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || null
  , [nodes, selectedNodeId]);

  return (
    <div className="relative w-full h-screen bg-[#020204] overflow-hidden selection:bg-cyan-500/30 flex">
      
      {/* 3D Scene Container */}
      <div 
        className={`relative h-full transition-all duration-500 ease-in-out z-0
        ${selectedNodeId !== null ? 'w-[calc(100vw-500px)]' : 'w-full'}
        `}
      >
        <Canvas
          camera={{ position: [0, 0, 35], fov: 60 }} 
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#020204']} />
          
          <ambientLight intensity={0.2} color="#4fd1c5" />
          <pointLight position={[0, 0, 0]} intensity={2} color="#4fd1c5" distance={30} />
          <pointLight position={[20, 20, 20]} intensity={1} color="#a78bfa" />
          <pointLight position={[-20, -20, -20]} intensity={1} color="#22d3ee" />

          <Stars radius={150} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          
          <Suspense fallback={null}>
            <NetworkGraph 
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleGraphNodeClick}
              searchQuery={searchQuery}
              tagColors={tagColors}
              clusterStrength={clusterStrength}
              isLinkMode={isLinkMode}
              linkSourceId={linkSourceId}
              isDeleteMode={isDeleteMode}
            />
          </Suspense>

          <OrbitControls 
            makeDefault
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={false} 
            enableDamping={true}
            dampingFactor={0.05}
            maxDistance={80}
            minDistance={0.1}
          />

          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.6} />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.3} darkness={0.8} />
          </EffectComposer>
        </Canvas>

        {/* Global HUD */}
        <div className="absolute inset-0 pointer-events-none">
          <UIOverlay 
            nodeCount={nodes.length} 
            linkCount={links.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            clusterStrength={clusterStrength}
            setClusterStrength={setClusterStrength}
            onReset={handleStartReset}
            onLoadDemo={loadDemo} 
            onAddNode={handleAddNode}
            onToggleDeleteMode={toggleDeleteMode}
            isDeleteMode={isDeleteMode}
            isLinkMode={isLinkMode}
            onToggleLinkMode={toggleLinkMode}
            nodeToDelete={nodeToDelete}
            onConfirmDelete={confirmDeleteNode}
            onCancelDelete={cancelDeleteNode}
            // Import/Export Props
            nodes={nodes}
            links={links}
            tagColors={tagColors}
            onImport={handleImportData}
            // Gemini Props
            apiKey={apiKey}
            onSetApiKey={updateApiKey}
            // Enhanced Mode
            isEnhancedMode={isEnhancedMode}
            onToggleEnhancedMode={toggleEnhancedMode}
            onInjectCluster={injectGraphCluster}
          />
        </div>
      </div>

      {/* Note Editor */}
      <div className={`relative h-full transition-all duration-500 ease-in-out border-l border-white/10 shadow-2xl z-40 bg-black/60 backdrop-blur-2xl
        ${selectedNodeId !== null ? 'w-[500px] translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
      `}>
          {selectedNodeId !== null && (
            <NotePanel 
                node={selectedNode} 
                allNodes={nodes}
                onClose={() => setSelectedNodeId(null)}
                onUpdate={updateNode}
                tagColors={tagColors}
                onTagColorChange={updateTagColor}
            />
          )}
      </div>
    </div>
  );
};

export default App;