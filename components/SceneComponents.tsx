import React, { useRef, useMemo, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Octahedron, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { NodeData, SignalParticle } from '../types';

// --- Color Mapping Strategy ---
export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const getNodeColor = (data: NodeData, isSelected: boolean, tagColors: Record<string, string>) => {
  // Gold Status Override
  if (data.tags.includes('_status_gold')) {
      return new THREE.Color('#FFD700'); // Gold
  }
  // Entropy Status Override
  if (data.tags.includes('_status_entropy')) {
      return new THREE.Color('#22d3ee'); // Electric Cyan
  }

  // Geometric Semantic Colors
  if (data.category === 'contradiction' || data.category === 'decision') return new THREE.Color('#ef4444'); // Red
  if (data.category === 'hypothesis') return new THREE.Color('#a855f7');    // Purple
  if (data.category === 'archive') return new THREE.Color('#f8fafc');       // White/Paper

  const primaryTag = data.tags && data.tags.length > 0 ? data.tags[0].toLowerCase() : 'default';
  let baseColorHex = tagColors[primaryTag];
  if (!baseColorHex) {
     baseColorHex = stringToColor(primaryTag);
  }
  return new THREE.Color(baseColorHex);
};

// --- Node Component ---
interface NodeMeshProps {
  data: NodeData;
  isActive: boolean; // Kept for prop-based triggers, but visual logic handles impulses
  isSelected: boolean;
  isDimmed?: boolean;
  isDeleteMode?: boolean; 
  tagColors: Record<string, string>;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
}

export const NodeMesh = forwardRef<THREE.Mesh, NodeMeshProps>(({ data, isActive, isSelected, isDimmed, isDeleteMode, tagColors, onHover, onClick }, ref) => {
  const localRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // We use this ref to trigger manual pulses from the parent without re-renders
  const pulseRef = useRef<number>(0);

  // Sync passed ref with local ref and attach custom method for pulsing
  React.useImperativeHandle(ref, () => Object.assign(localRef.current!, {
      triggerPulse: () => { pulseRef.current = 1.0; }
  }));

  const isGold = data.tags.includes('_status_gold');
  const isEntropy = data.tags.includes('_status_entropy');
  const isMaterializing = data.tags.includes('_status_materializing');
  const isArchive = data.category === 'archive';
  const isDecision = data.category === 'contradiction' || data.category === 'decision';
  const isHypothesis = data.category === 'hypothesis';

  // Constants for Ghost Flashing
  const ghostColorA = useMemo(() => new THREE.Color('#94a3b8'), []); // Blue-Gray
  const ghostColorB = useMemo(() => new THREE.Color('#ef4444'), []); // Red

  const material = useMemo(() => {
    // 0. Ghost Node Override
    if (data.isGhost) {
        return new THREE.MeshStandardMaterial({
            color: '#94a3b8', // Start gray
            emissive: '#94a3b8',
            emissiveIntensity: 1.0,
            wireframe: true, 
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1,
            toneMapped: false
        });
    }

    // 0.5 Materializing Override (Spinning Wireframe)
    if (isMaterializing) {
        return new THREE.MeshStandardMaterial({
            color: '#a855f7', // Purple
            emissive: '#d8b4fe',
            emissiveIntensity: 2.0,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
            toneMapped: false
        });
    }

    // 1. Delete Mode Override
    if (isDeleteMode && hovered) {
        return new THREE.MeshStandardMaterial({
            color: '#ef4444', 
            emissive: '#b91c1c', 
            emissiveIntensity: 2.5,
            roughness: 0.1,
            metalness: 0.8,
            toneMapped: false
        });
    }

    // 2. Gold / Synthesis Override
    if (isGold) {
        return new THREE.MeshStandardMaterial({
            color: '#FFD700',
            emissive: '#FDB931',
            emissiveIntensity: 2.0,
            roughness: 0.1,
            metalness: 1.0,
            toneMapped: false
        });
    }

    // 2.5 Entropy Override
    if (isEntropy) {
        return new THREE.MeshStandardMaterial({
            color: '#22d3ee',
            emissive: '#67e8f9',
            emissiveIntensity: 3.0,
            roughness: 0.1,
            metalness: 1.0,
            toneMapped: false
        });
    }

    // 3. Standard Coloring with Geometric Semantics
    const color = getNodeColor(data, isSelected, tagColors);
    
    if (isDimmed) {
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        color.setHSL(hsl.h, hsl.s * 0.2, 0.05); 
    }

    // Emissive Logic
    let emissiveIntensity = isSelected ? 2.5 : (isDimmed ? 0 : (isActive ? 1.5 : 0.6));
    
    // Decisions/Contradictions burn brighter
    if (isDecision && !isDimmed) {
        emissiveIntensity = 2.0;
    }

    // Hypotheses are glassy
    if (isHypothesis) {
        return new THREE.MeshPhysicalMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: emissiveIntensity * 0.5,
            roughness: 0.0,
            metalness: 0.1,
            transmission: 0.6, // Glass-like
            thickness: 0.5,
            transparent: true,
            opacity: isDimmed ? 0.1 : 0.8,
            toneMapped: false
        });
    }

    // Archives are matte/heavy
    if (isArchive) {
         return new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: isSelected ? 1.0 : 0.2, // Low emissive
            roughness: 0.7,
            metalness: 0.2,
            toneMapped: false
        });
    }

    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: emissiveIntensity, 
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: isDimmed ? 0.2 : 1,
      toneMapped: false
    });
  }, [data.tags, data.category, data.isGhost, isSelected, isDimmed, tagColors, isDeleteMode, hovered, isActive, isGold, isEntropy, isMaterializing, isArchive, isDecision, isHypothesis, ghostColorA, ghostColorB]);

  useFrame((state, delta) => {
    if (localRef.current) {
      // --- Impulse Handling ---
      if (pulseRef.current > 0) {
          pulseRef.current -= delta * 2; // Decay
          if (pulseRef.current < 0) pulseRef.current = 0;
      }

      if (isDimmed) {
          localRef.current.scale.lerp(new THREE.Vector3(0.05, 0.05, 0.05), 0.1);
          return;
      }

      // --- Ghost Flashing Animation ---
      if (data.isGhost && !hovered) {
          const t = state.clock.elapsedTime;
          // Pulse speed 3, range 0 to 1
          const alpha = (Math.sin(t * 3) + 1) / 2; 
          
          const mat = localRef.current.material as THREE.MeshStandardMaterial;
          if (mat.color && mat.emissive) {
              // Lerp between Blue-Gray and Red
              mat.color.lerpColors(ghostColorA, ghostColorB, alpha);
              mat.emissive.lerpColors(ghostColorA, ghostColorB, alpha);
              mat.emissiveIntensity = 1.0 + (alpha * 0.5); // Pulse intensity slightly
          }
      }

      let baseScale = 0.1; 
      // Size semantics
      if (isArchive) baseScale = 0.5; // Big Cubes
      if (isDecision) baseScale = 0.15;
      if (isHypothesis) baseScale = 0.15;
      if (data.isGhost) baseScale = 0.15;

      let targetScale = baseScale;
      
      // Add manual pulse influence
      const impulseScale = 1.0 + (pulseRef.current * 0.5);

      if (isSelected || isGold || isEntropy || isMaterializing) targetScale = baseScale * 1.5;
      else if (hovered) targetScale = baseScale * 1.2;
      
      // Pulse effect calculation
      const t = state.clock.elapsedTime;
      const pulse = isActive || isGold || isMaterializing
        ? Math.sin(t * 10) * 0.15 + 1.15 
        : Math.sin(t * 2 + data.id) * 0.05 + 1; 
      
      // Materializing Spin
      if (isMaterializing) {
          localRef.current.rotation.x += 0.05;
          localRef.current.rotation.y += 0.05;
      }
      
      // Contradictions tumble uneasily
      if (isDecision) {
          localRef.current.rotation.x += 0.01;
          localRef.current.rotation.z -= 0.02;
      }

      // Hypotheses breathe slowly
      const hypothesisPulse = isHypothesis ? Math.sin(t * 1.5) * 0.1 + 1 : 1;
      
      const finalScale = targetScale * pulse * hypothesisPulse * impulseScale;
      
      localRef.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.1);
      
      // Archives rotate very slowly
      if (isArchive) {
          localRef.current.rotation.y += 0.002;
          localRef.current.rotation.x += 0.001;
      }
    }
  });

  const commonProps = {
      ref: localRef,
      position: data.position,
      onClick: (e: any) => { if (!isDimmed) { e.stopPropagation(); onClick(data.id); } },
      onPointerOver: (e: any) => { if (!isDimmed) { e.stopPropagation(); setHovered(true); onHover(data.id); } },
      onPointerOut: (e: any) => { setHovered(false); onHover(null); },
      material: material
  };

  if (isArchive) {
      return <Box args={[1, 1, 1]} {...commonProps} />;
  }
  if (isDecision) {
      return <Octahedron args={[1, 0]} {...commonProps} />;
  }
  if (isHypothesis) {
      return <Icosahedron args={[1, 0]} {...commonProps} />;
  }

  return <Sphere args={[1, 32, 32]} {...commonProps} />;
});

// --- Connection Component ---
interface ConnectionProps {
  startNode: NodeData;
  endNode: NodeData;
  isActive: boolean;
  isDimmed?: boolean;
}

export const Connection: React.FC<ConnectionProps> = ({ startNode, endNode, isActive, isDimmed }) => {
  const lineRef = useRef<THREE.Line>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const effectiveDim = isDimmed && !isActive;

  const color = useMemo(() => {
      // Decision/Contradiction links are RED
      if (startNode.category === 'decision' || endNode.category === 'decision' || startNode.category === 'contradiction' || endNode.category === 'contradiction') return new THREE.Color('#ef4444');
      
      if (startNode.isGhost || endNode.isGhost) return new THREE.Color('#f43f5e');
      if (isActive) return new THREE.Color('#ffffff');
      if (effectiveDim) return new THREE.Color('#1e293b');
      return new THREE.Color('#475569');
  }, [isActive, effectiveDim, startNode, endNode]);
  
  const opacity = (startNode.isGhost || endNode.isGhost) ? 0.2 : (isActive ? 0.8 : (effectiveDim ? 0.05 : 0.2));

  const positions = useMemo(() => new Float32Array(6), []);

  useFrame(() => {
    if (geometryRef.current && startNode?.position && endNode?.position) {
        const p1 = startNode.position;
        const p2 = endNode.position;
        const posAttr = geometryRef.current.attributes.position;
        if (posAttr) {
            posAttr.setXYZ(0, p1.x, p1.y, p1.z);
            posAttr.setXYZ(1, p2.x, p2.y, p2.z);
            posAttr.needsUpdate = true;
        }
    }
  });

  if (!startNode || !endNode) return null;

  return (
    <line ref={lineRef as any}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" count={2} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} linewidth={1} />
    </line>
  );
};

// --- Lightning Connection for Entropy ---
export const LightningConnection: React.FC<{ startNode: NodeData, endNode: NodeData }> = ({ startNode, endNode }) => {
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const SEGMENTS = 10;
    const positions = useMemo(() => new Float32Array((SEGMENTS + 1) * 3), []);

    useFrame((state) => {
        if (geometryRef.current && startNode && endNode && startNode.position && endNode.position) {
            const posAttr = geometryRef.current.attributes.position;
            const start = startNode.position;
            const end = endNode.position;
            const diff = end.clone().sub(start);
            
            for (let i = 0; i <= SEGMENTS; i++) {
                const t = i / SEGMENTS;
                const px = start.x + diff.x * t;
                const py = start.y + diff.y * t;
                const pz = start.z + diff.z * t;
                
                if (i > 0 && i < SEGMENTS) {
                    const noise = 0.5; // Amplitude of jaggedness
                    const jx = (Math.random() - 0.5) * noise;
                    const jy = (Math.random() - 0.5) * noise;
                    const jz = (Math.random() - 0.5) * noise;
                    posAttr.setXYZ(i, px + jx, py + jy, pz + jz);
                } else {
                    posAttr.setXYZ(i, px, py, pz);
                }
            }
            posAttr.needsUpdate = true;
        }
    });

    return (
        <line>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute attach="attributes-position" count={SEGMENTS + 1} array={positions} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#22d3ee" linewidth={2} transparent opacity={0.8} toneMapped={false} />
        </line>
    );
};

// --- Signal Component ---
interface SignalProps {
  particle: SignalParticle;
  nodeMap: Map<number, NodeData>; 
}

export const Signal: React.FC<SignalProps> = ({ particle, nodeMap }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const sourceNode = nodeMap.get(particle.sourceId);
  const targetNode = nodeMap.get(particle.targetId);

  // CRITICAL FIX: Ensure hook order is consistent by moving useFrame before conditional return
  useFrame((state) => {
    if (meshRef.current && sourceNode && targetNode) {
      const elapsed = state.clock.elapsedTime - particle.startTime;
      const progress = Math.min(Math.max(elapsed * particle.speed, 0), 1);
      
      meshRef.current.position.lerpVectors(sourceNode.position, targetNode.position, progress);
      const scale = Math.sin(progress * Math.PI) * 0.08 + 0.02;
      meshRef.current.scale.setScalar(scale);

      // Hide if done to avoid visual clutter before cleanup
      if (progress >= 1) {
          meshRef.current.visible = false;
      }
    }
  });

  if (!sourceNode || !targetNode) return null;

  return (
    <Sphere ref={meshRef} args={[1, 8, 8]}>
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </Sphere>
  );
};