import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeMesh, Connection, Signal } from './SceneComponents';
import { SignalParticle, NodeData, LinkData } from '../types';

interface NetworkGraphProps {
  nodes: NodeData[];
  links: LinkData[];
  selectedNodeId: number | null;
  onNodeClick: (id: number) => void;
  searchQuery: string;
  tagColors: Record<string, string>;
  clusterStrength: number;
  isLinkMode: boolean;
  linkSourceId: number | null; 
  isDeleteMode: boolean; 
}

// Simple ID generator to replace uuid
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const CameraController: React.FC<{ targetNode: NodeData | null }> = ({ targetNode }) => {
    const { camera, controls } = useThree();
    
    useFrame((state, delta) => {
        // @ts-ignore
        const orbitControls = controls as any;
        if (targetNode && orbitControls) {
            const targetPos = targetNode.position;
            // Safety check
            if (Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y)) {
                orbitControls.target.lerp(targetPos, delta * 2);
            }
        }
    });

    return null;
}

// Visual component for the "Synapse" being built
const GhostSynapse: React.FC<{ startPos: THREE.Vector3 }> = ({ startPos }) => {
    const { camera, pointer } = useThree();
    const geometryRef = useRef<THREE.BufferGeometry>(null);

    // Initial buffer
    const positions = useMemo(() => new Float32Array(6), []);

    useFrame(() => {
        if (!startPos || !geometryRef.current) return;

        // Project pointer to a reasonable depth
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
                <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial 
                color="#a855f7" 
                opacity={0.6}
                transparent
            />
        </line>
    );
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
    nodes, links, selectedNodeId, onNodeClick, searchQuery, tagColors, clusterStrength,
    isLinkMode, linkSourceId, isDeleteMode
}) => {
  const speed = 0.5;

  const [signals, setSignals] = useState<SignalParticle[]>([]);
  const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Refs for physics
  const nodeRefs = useRef<Record<number, THREE.Mesh>>({});
  const velocities = useRef<Record<number, THREE.Vector3>>({});
  
  // Create a fast lookup map for nodes by ID to avoid O(n) lookups
  const nodeMap = useMemo(() => {
    const map = new Map<number, NodeData>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Search filtering
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery) return new Set<number>();
    const lowerQ = searchQuery.toLowerCase();
    const ids = new Set<number>();
    nodes.forEach(node => {
        if (node.title.toLowerCase().includes(lowerQ) || node.tags.some(t => t.toLowerCase().includes(lowerQ))) {
            ids.add(node.id);
        }
    });
    return ids;
  }, [searchQuery, nodes]);

  // Initialize velocities
  useEffect(() => {
    nodes.forEach(node => {
      if (!velocities.current[node.id]) {
        velocities.current[node.id] = new THREE.Vector3(0, 0, 0);
      }
    });
  }, [nodes]);

  // Physics & Animation Loop
  useFrame((state, delta) => {
    // Clamp delta to prevent physics explosions on frame drops
    const safeDelta = Math.min(delta, 0.05);

    // 1. Signal Animation
    const timeScale = safeDelta * speed * 4;
    setSignals(prevSignals => {
      const nextSignals: SignalParticle[] = [];
      const arrivedSignals: SignalParticle[] = [];

      prevSignals.forEach(sig => {
        sig.progress += sig.speed * timeScale;
        if (sig.progress >= 1) {
          arrivedSignals.push(sig);
        } else {
          nextSignals.push(sig);
        }
      });

      if (arrivedSignals.length > 0) {
        const newlyActive = new Set<number>();
        arrivedSignals.forEach(sig => newlyActive.add(sig.targetId));
        
        if (newlyActive.size > 0) {
            setActiveNodes(prev => {
                const next = new Set(prev);
                newlyActive.forEach(id => next.add(id));
                return next;
            });
            setTimeout(() => {
                setActiveNodes(prev => {
                    const next = new Set(prev);
                    newlyActive.forEach(id => next.delete(id));
                    return next;
                });
            }, 300);
        }
      }
      return nextSignals;
    });

    // 2. Physics Simulation
    const damping = 0.9;
    const repulsionStrength = 2.0;
    const springStrength = 0.05;
    const centeringStrength = 0.02;

    // Apply forces
    nodes.forEach(node => {
       if (node.id === selectedNodeId) return; // Selected node stays still

       const velocity = velocities.current[node.id];
       if (!velocity) return;

       const force = new THREE.Vector3(0,0,0);

       // Self-healing: If position is NaN, reset it
       if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y) || !Number.isFinite(node.position.z)) {
            node.position.set( (Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10 );
            velocity.set(0,0,0);
       }

       // Centering Force (Gravity to origin)
       if (Number.isFinite(node.position.x)) {
           force.add(node.position.clone().multiplyScalar(-centeringStrength));
       }

       // Cluster Force (Attraction to same tags)
       if (clusterStrength > 0.01) {
           nodes.forEach(other => {
               if (node.id === other.id) return;
               // Check tag match
               const hasSharedTag = node.tags.length > 0 && other.tags.length > 0 && node.tags[0] === other.tags[0];
               if (hasSharedTag) {
                   const diff = other.position.clone().sub(node.position);
                   const dist = diff.length();
                   if (dist > 0) {
                       diff.normalize().multiplyScalar(dist * clusterStrength * 0.05); // Weak gravity
                       force.add(diff);
                   }
               }
           });
       }

       // Repulsion Force (Keep apart)
       nodes.forEach(other => {
           if (node.id === other.id) return;
           const diff = node.position.clone().sub(other.position);
           const dist = diff.length();
           if (dist < 15 && dist > 0.1) {
               const repulsion = diff.normalize().multiplyScalar(repulsionStrength / (dist * dist));
               force.add(repulsion);
           }
       });

       velocity.add(force);
    });

    // Spring Forces (Connections)
    links.forEach(link => {
       const source = nodeMap.get(link.source);
       const target = nodeMap.get(link.target);
       
       if (!source || !target) return;
       
       const dist = source.position.distanceTo(target.position);
       const restingLength = 8;
       
       if (dist > 0) {
           const forceMag = (dist - restingLength) * springStrength;
           const dir = target.position.clone().sub(source.position).normalize();
           
           if (source.id !== selectedNodeId) {
             velocities.current[source.id]?.add(dir.clone().multiplyScalar(forceMag));
           }
           if (target.id !== selectedNodeId) {
             velocities.current[target.id]?.add(dir.clone().multiplyScalar(-forceMag));
           }
       }
    });

    // Update Positions
    nodes.forEach(node => {
        if (node.id === selectedNodeId) return;
        const vel = velocities.current[node.id];
        if (vel) {
            vel.multiplyScalar(damping);
            
            // Validate velocity before applying
            if (Number.isFinite(vel.x) && Number.isFinite(vel.y) && Number.isFinite(vel.z)) {
                node.position.add(vel.clone().multiplyScalar(safeDelta * 20)); 
            } else {
                 // Reset velocity if corrupt
                 vel.set(0,0,0);
            }
            
            // Update Mesh
            if (nodeRefs.current[node.id]) {
                nodeRefs.current[node.id].position.copy(node.position);
            }
        }
    });

  });

  const handleNodeClick = (id: number) => {
    // Only fire signal animations if NOT in delete mode
    if (!isDeleteMode) {
        const node = nodeMap.get(id);
        if (node) {
            const newSignals = node.connections.map(targetId => ({
                id: generateId(),
                sourceId: id,
                targetId: targetId,
                progress: 0,
                speed: 1.0
            }));
            setSignals(prev => [...prev, ...newSignals]);
        }
    }
    
    // Bubble up to parent
    onNodeClick(id);
  };

  const selectedNodeData = useMemo(() => 
    selectedNodeId !== null ? nodeMap.get(selectedNodeId) || null : null
  , [nodeMap, selectedNodeId]);

  const linkSourceNode = useMemo(() => 
     linkSourceId !== null ? nodeMap.get(linkSourceId) || null : null
  , [nodeMap, linkSourceId]);

  // Adjust cursor based on mode
  useEffect(() => {
    if (isDeleteMode) {
        document.body.style.cursor = 'not-allowed';
    } else if (isLinkMode) {
        document.body.style.cursor = 'crosshair';
    } else {
        document.body.style.cursor = 'auto';
    }
    return () => { document.body.style.cursor = 'auto'; };
  }, [isLinkMode, isDeleteMode]);


  return (
    <group>
      <CameraController targetNode={selectedNodeData} />

      {/* Ghost Synapse for Link Mode */}
      {isLinkMode && linkSourceNode && (
          <GhostSynapse startPos={linkSourceNode.position} />
      )}

      {nodes.map(node => {
        const isDimmed = searchQuery !== "" && !filteredNodeIds.has(node.id) && selectedNodeId !== node.id;
        // In link mode, highlight potential targets
        const isPotentialTarget = isLinkMode && linkSourceId !== null && linkSourceId !== node.id;
        
        return (
            <NodeMesh 
                key={node.id} 
                ref={(el) => { if (el) nodeRefs.current[node.id] = el; }}
                data={node} 
                isActive={activeNodes.has(node.id) || isPotentialTarget}
                isSelected={selectedNodeId === node.id || linkSourceId === node.id}
                isDimmed={isDimmed}
                isDeleteMode={isDeleteMode} 
                tagColors={tagColors} 
                onHover={setHoveredNode}
                onClick={handleNodeClick}
            />
        );
      })}

      {links.map(link => {
          const sourceNode = nodeMap.get(link.source);
          const targetNode = nodeMap.get(link.target);
          
          if (!sourceNode || !targetNode) return null;

          const isConnectedToHover = hoveredNode !== null && (link.source === hoveredNode || link.target === hoveredNode);
          const isConnectedToSelected = selectedNodeId !== null && (link.source === selectedNodeId || link.target === selectedNodeId);
          const isDimmed = searchQuery !== "";

          return (
            <Connection 
                key={link.id} 
                startNode={sourceNode}
                endNode={targetNode}
                isActive={isConnectedToHover || isConnectedToSelected}
                isDimmed={isDimmed}
            />
          );
      })}

      {signals.map(sig => (
         <Signal key={sig.id} particle={sig} nodeMap={nodeMap} />
      ))}
    </group>
  );
};