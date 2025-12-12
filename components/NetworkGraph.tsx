import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeMesh, Connection, Signal, LightningConnection } from './SceneComponents';
import { SignalParticle, NodeData, LinkData } from '../types';

interface NetworkGraphProps {
  nodes: NodeData[];
  links: LinkData[];
  selectedNodeId: number | null;
  onNodeClick: (id: number) => void;
  searchQuery: string;
  searchMode: 'title' | 'tag';
  tagColors: Record<string, string>;
  clusterStrength: number;
  isLinkMode: boolean;
  linkSourceId: number | null; 
  isDeleteMode: boolean; 
  isEngramMode: boolean;
  engramSelection: Set<number>;
  isInferenceMode: boolean;
  inferenceSelection: Set<number>;
  isEntropyMode: boolean;
  entropySelection: Set<number>;
  onHoverNode?: (id: number | null) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const CameraController: React.FC<{ targetNode: NodeData | null, entropyTarget: THREE.Vector3 | null }> = ({ targetNode, entropyTarget }) => {
    const { controls } = useThree();
    useFrame((state, delta) => {
        // @ts-ignore
        const orbitControls = controls as any;
        if (orbitControls) {
            if (entropyTarget) {
                 orbitControls.target.lerp(entropyTarget, delta * 3);
            } else if (targetNode) {
                const targetPos = targetNode.position;
                if (Number.isFinite(targetPos.x)) {
                    orbitControls.target.lerp(targetPos, delta * 2);
                }
            }
        }
    });
    return null;
}

const GhostSynapse: React.FC<{ startPos: THREE.Vector3 }> = ({ startPos }) => {
    const { camera, pointer } = useThree();
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const positions = useMemo(() => new Float32Array(6), []);

    useFrame(() => {
        if (!startPos || !geometryRef.current) return;
        const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const targetDistance = camera.position.distanceTo(startPos);
        const pos = camera.position.clone().add(dir.multiplyScalar(targetDistance));
        const posAttr = geometryRef.current.attributes.position;
        if (posAttr && Number.isFinite(pos.x)) {
             posAttr.setXYZ(0, startPos.x, startPos.y, startPos.z);
             posAttr.setXYZ(1, pos.x, pos.y, pos.z);
             posAttr.needsUpdate = true;
        }
    });

    if (!startPos) return null;
    return (
        <line>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute attach="attributes-position" count={2} array={positions} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#a855f7" opacity={0.6} transparent />
        </line>
    );
};

const EngramWeb: React.FC<{ nodes: NodeData[], selection: Set<number> }> = ({ nodes, selection }) => {
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const selectedNodes = useMemo(() => nodes.filter(n => selection.has(n.id)), [nodes, selection]);
    const lines = useMemo(() => {
        const positions: number[] = [];
        if (selectedNodes.length < 2) return new Float32Array(0);
        for (let i = 0; i < selectedNodes.length; i++) {
            for (let j = i + 1; j < selectedNodes.length; j++) {
                const p1 = selectedNodes[i].position;
                const p2 = selectedNodes[j].position;
                positions.push(p1.x, p1.y, p1.z);
                positions.push(p2.x, p2.y, p2.z);
            }
        }
        return new Float32Array(positions);
    }, [selectedNodes]);

    useFrame(() => {
        if (geometryRef.current && selectedNodes.length >= 2) {
             const posAttr = geometryRef.current.attributes.position;
             if (!posAttr || posAttr.count * 3 !== lines.length) return;
             let idx = 0;
             const array = posAttr.array as Float32Array;
             for (let i = 0; i < selectedNodes.length; i++) {
                for (let j = i + 1; j < selectedNodes.length; j++) {
                    const p1 = selectedNodes[i].position;
                    const p2 = selectedNodes[j].position;
                    array[idx++] = p1.x; array[idx++] = p1.y; array[idx++] = p1.z;
                    array[idx++] = p2.x; array[idx++] = p2.y; array[idx++] = p2.z;
                }
             }
             posAttr.needsUpdate = true;
        }
    });

    if (selectedNodes.length < 2) return null;
    return (
        <lineSegments>
            <bufferGeometry ref={geometryRef} key={lines.length}>
                <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#FFD700" opacity={0.3} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </lineSegments>
    );
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
    nodes, links, selectedNodeId, onNodeClick, searchQuery, searchMode, tagColors, clusterStrength,
    isLinkMode, linkSourceId, isDeleteMode, isEngramMode, engramSelection, 
    isInferenceMode, inferenceSelection, onHoverNode, isEntropyMode, entropySelection
}) => {
  const [signals, setSignals] = useState<SignalParticle[]>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Optimizations
  const nodeRefs = useRef<Record<number, any>>({});
  const velocities = useRef<Record<number, THREE.Vector3>>({});
  const frameCounter = useRef(0);
  
  // Reusable vectors for physics loop to reduce GC
  const vecForce = useMemo(() => new THREE.Vector3(), []);
  const vecDiff = useMemo(() => new THREE.Vector3(), []);
  const vecDir = useMemo(() => new THREE.Vector3(), []);
  
  const nodeMap = useMemo(() => {
    const map = new Map<number, NodeData>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Entropy Target Calculation (Midpoint of 2 selected nodes)
  const entropyTarget = useMemo(() => {
      const entropyNode = nodes.find(n => n.tags.includes('_status_entropy'));
      if (entropyNode && entropyNode.position) return entropyNode.position;

      if (isEntropyMode && entropySelection.size === 2) {
          const ids = Array.from(entropySelection);
          const n1 = nodeMap.get(ids[0]);
          const n2 = nodeMap.get(ids[1]);
          if (n1?.position && n2?.position) {
              return n1.position.clone().add(n2.position).multiplyScalar(0.5);
          }
      }
      return null;
  }, [nodes, isEntropyMode, entropySelection, nodeMap]);

  // Search
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery) return new Set<number>();
    const lowerQ = searchQuery.toLowerCase();
    const ids = new Set<number>();
    nodes.forEach(node => {
        if (searchMode === 'title') {
            if (node.title.toLowerCase().includes(lowerQ)) ids.add(node.id);
        } else {
            if (node.tags.some(t => t.toLowerCase().includes(lowerQ))) ids.add(node.id);
        }
    });
    return ids;
  }, [searchQuery, nodes, searchMode]);

  useEffect(() => {
    nodes.forEach(node => {
      if (!velocities.current[node.id]) velocities.current[node.id] = new THREE.Vector3(0, 0, 0);
    });
  }, [nodes]);

  const handleNodeHover = (id: number | null) => { setHoveredNode(id); if (onHoverNode) onHoverNode(id); };

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const elapsedTime = state.clock.elapsedTime;
    frameCounter.current += 1;

    // --- Signal Pruning (Batched) ---
    // Instead of filtering every frame, we do a check every 500ms approx via simpler random check or just let them live
    // For hackathon, we only setSignals when user clicks, so it's fine to clean them up lazily
    // BUT we need to trigger node pulses when signals arrive
    
    // Iterate active signals to trigger pulses on target nodes
    // Note: We are iterating state 'signals' here, which is fine as we are not setting state
    signals.forEach(sig => {
        const age = (elapsedTime - sig.startTime) * sig.speed;
        if (age >= 1.0 && age <= 1.1) { 
             // Signal arrived roughly now. Trigger pulse on target
             const targetMesh = nodeRefs.current[sig.targetId];
             if (targetMesh && targetMesh.triggerPulse) {
                 targetMesh.triggerPulse();
             }
        }
    });
    
    // Cleanup old signals every ~1s (when frame count mod 60 === 0)
    // Using a ref to track last cleanup time would be better but this is a demo
    if (frameCounter.current % 60 === 0 && signals.length > 0) {
         const activeSignals = signals.filter(s => (elapsedTime - s.startTime) * s.speed < 1.2);
         if (activeSignals.length !== signals.length) {
             setSignals(activeSignals);
         }
    }

    // --- Physics ---
    nodes.forEach(node => {
       if (node.id === selectedNodeId) return;
       const velocity = velocities.current[node.id];
       if (!velocity || !node.position) return;
       
       // FREEZE ENTROPY NODE
       if (node.tags.includes('_status_entropy')) {
           velocity.set(0, 0, 0);
           return;
       }

       vecForce.set(0,0,0);

       if (!Number.isFinite(node.position.x)) { node.position.set(0,0,0); velocity.set(0,0,0); }
       
       // Gravity to center
       vecForce.add(node.position.clone().multiplyScalar(node.isGhost ? -0.004 : -0.02)); 

       // Clustering
       if (clusterStrength > 0.01 && !node.isGhost) {
           nodes.forEach(other => {
               if (node.id === other.id || other.isGhost) return;
               
               if (node.tags[0] && other.tags[0] && node.tags[0] === other.tags[0]) {
                   if (!other.position) return;
                   vecDiff.copy(other.position).sub(node.position);
                   const lenSq = vecDiff.lengthSq();
                   if (lenSq > 0) {
                        // Normalize manually to avoid alloc
                        const len = Math.sqrt(lenSq);
                        vecDiff.multiplyScalar((1/len) * len * clusterStrength * 0.05);
                        vecForce.add(vecDiff);
                   }
               }
           });
       }

       // Repulsion
       nodes.forEach(other => {
           if (node.id === other.id || !other.position) return;
           vecDiff.copy(node.position).sub(other.position);
           const distSq = vecDiff.lengthSq();
           
           const rep = (node.isGhost || other.isGhost) ? 4.0 : 2.0;
           const archiveMultiplier = (node.category === 'archive' || other.category === 'archive') ? 5.0 : 1.0;

           // Optimization: Check distSq instead of sqrt(dist)
           // 15*15 = 225
           if (distSq < 225 && distSq > 0.01) {
               const dist = Math.sqrt(distSq);
               vecDiff.normalize().multiplyScalar((rep * archiveMultiplier) / distSq);
               vecForce.add(vecDiff);
           }
       });

       velocity.add(vecForce);
    });

    // Link Constraints
    links.forEach(link => {
       const source = nodeMap.get(link.source);
       const target = nodeMap.get(link.target);
       if (!source || !target || !source.position || !target.position) return;
       
       const dist = source.position.distanceTo(target.position);
       if (dist > 0) {
           const forceMag = (dist - 8) * 0.05;
           vecDir.copy(target.position).sub(source.position).normalize();
           
           if (source.id !== selectedNodeId) velocities.current[source.id]?.add(vecDir.clone().multiplyScalar(forceMag));
           if (target.id !== selectedNodeId) velocities.current[target.id]?.add(vecDir.clone().multiplyScalar(-forceMag));
       }
    });

    // Apply Velocity
    nodes.forEach(node => {
        if (node.id === selectedNodeId) return;
        const vel = velocities.current[node.id];
        if (vel && node.position) {
            
            // Drag
            if (node.category === 'archive') {
                vel.multiplyScalar(0.85); 
            } else {
                vel.multiplyScalar(0.9);
            }

            if (Number.isFinite(vel.x)) {
                 const moveScale = node.category === 'archive' ? 0.2 : 1.0;
                 // Manually add
                 node.position.x += vel.x * safeDelta * 20 * moveScale;
                 node.position.y += vel.y * safeDelta * 20 * moveScale;
                 node.position.z += vel.z * safeDelta * 20 * moveScale;
            }
            if (nodeRefs.current[node.id]) nodeRefs.current[node.id].position.copy(node.position);
        }
    });
  });

  // Use the Three.js clock to manage signal start times
  const { clock } = useThree();

  const handleNodeClick = (id: number) => {
    if (!isDeleteMode && !isEngramMode && !isInferenceMode && !isEntropyMode) {
        const node = nodeMap.get(id);
        if (node) {
            const newSignals = node.connections.map(targetId => ({ 
                id: generateId(), 
                sourceId: id, 
                targetId, 
                startTime: clock.elapsedTime, // Use clock time
                speed: 1.0 
            }));
            setSignals(prev => [...prev, ...newSignals]);
            
            // Trigger local pulse immediately
            if (nodeRefs.current[id] && nodeRefs.current[id].triggerPulse) {
                nodeRefs.current[id].triggerPulse();
            }
        }
    }
    onNodeClick(id);
  };

  const selectedNodeData = useMemo(() => selectedNodeId !== null ? nodeMap.get(selectedNodeId) || null : null, [nodeMap, selectedNodeId]);
  const linkSourceNode = useMemo(() => linkSourceId !== null ? nodeMap.get(linkSourceId) || null : null, [nodeMap, linkSourceId]);

  useEffect(() => {
    document.body.style.cursor = isDeleteMode ? 'not-allowed' : isLinkMode ? 'crosshair' : isEngramMode ? 'alias' : isInferenceMode ? 'help' : isEntropyMode ? 'crosshair' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [isLinkMode, isDeleteMode, isEngramMode, isInferenceMode, isEntropyMode]);

  return (
    <group>
      <CameraController targetNode={selectedNodeData} entropyTarget={entropyTarget} />
      {isLinkMode && linkSourceNode && <GhostSynapse startPos={linkSourceNode.position} />}
      {isEngramMode && engramSelection.size > 0 && <EngramWeb nodes={nodes} selection={engramSelection} />}
      
      {isEntropyMode && entropySelection.size === 2 && (() => {
          const ids = Array.from(entropySelection);
          const n1 = nodeMap.get(ids[0]);
          const n2 = nodeMap.get(ids[1]);
          if (n1?.position && n2?.position) return <LightningConnection startNode={n1} endNode={n2} />;
          return null;
      })()}

      {nodes.map(node => {
        const isDimmed = searchQuery !== "" && !filteredNodeIds.has(node.id) && selectedNodeId !== node.id;
        const isPotentialTarget = (isLinkMode && linkSourceId !== null && linkSourceId !== node.id);
        const isEngramSelected = isEngramMode && engramSelection.has(node.id);
        const isInferenceSelected = isInferenceMode && inferenceSelection.has(node.id);
        const isEntropySelected = isEntropyMode && entropySelection.has(node.id);
        const effectiveTags = (isEngramSelected || isInferenceSelected || isEntropySelected) ? [...node.tags, '_status_gold'] : node.tags;
        
        return (
            <NodeMesh 
                key={node.id} 
                ref={(el) => { if (el) nodeRefs.current[node.id] = el; }}
                data={{...node, tags: effectiveTags}} 
                isActive={isPotentialTarget || isEngramSelected || isInferenceSelected || isEntropySelected}
                isSelected={selectedNodeId === node.id || linkSourceId === node.id || isEngramSelected || isInferenceSelected || isEntropySelected}
                isDimmed={isDimmed} isDeleteMode={isDeleteMode} tagColors={tagColors} onHover={handleNodeHover} onClick={handleNodeClick}
            />
        );
      })}

      {links.map(link => {
          const s = nodeMap.get(link.source);
          const t = nodeMap.get(link.target);
          if (!s || !t) return null;
          if (!s.position || !t.position) return null; 

          if (s.tags.includes('_status_entropy') || t.tags.includes('_status_entropy')) {
              return <LightningConnection key={link.id} startNode={s} endNode={t} />;
          }
          const active = hoveredNode !== null && (link.source === hoveredNode || link.target === hoveredNode);
          return <Connection key={link.id} startNode={s} endNode={t} isActive={active || selectedNodeId === link.source || selectedNodeId === link.target} isDimmed={searchQuery !== ""} />;
      })}
      {signals.map(sig => <Signal key={sig.id} particle={sig} nodeMap={nodeMap} />)}
    </group>
  );
};