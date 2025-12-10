import React, { useRef, useMemo, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
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

const getNodeColor = (tags: string[], isSelected: boolean, colorMap: Record<string, string>) => {
  const primaryTag = tags && tags.length > 0 ? tags[0].toLowerCase() : 'default';
  let baseColorHex = colorMap[primaryTag];
  if (!baseColorHex) {
     baseColorHex = stringToColor(primaryTag);
  }
  const color = new THREE.Color(baseColorHex);
  
  if (isSelected) {
     const hsl = { h: 0, s: 0, l: 0 };
     color.getHSL(hsl);
     color.setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.3));
  }
  return color;
};

// --- Node Component ---
interface NodeMeshProps {
  data: NodeData;
  isActive: boolean;
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

  // Sync passed ref with local ref
  React.useImperativeHandle(ref, () => localRef.current!);

  const material = useMemo(() => {
    // 1. Delete Mode Override: Turn RED if hovered in delete mode
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

    // 2. Standard Coloring
    const color = getNodeColor(data.tags, isSelected, tagColors);
    
    if (isDimmed) {
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        color.setHSL(hsl.h, hsl.s * 0.2, 0.05); 
    }

    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: isSelected ? 3.0 : (isDimmed ? 0 : (isActive ? 1.5 : 0.6)), 
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: isDimmed ? 0.2 : 1,
      toneMapped: false
    });
  }, [data.tags, isSelected, isDimmed, tagColors, isDeleteMode, hovered, isActive]);

  useFrame((state) => {
    if (localRef.current) {
      if (isDimmed) {
          localRef.current.scale.lerp(new THREE.Vector3(0.05, 0.05, 0.05), 0.1);
          return;
      }

      let targetScale = 0.1;
      if (isSelected) targetScale = 0.3;
      else if (hovered) targetScale = 0.18;
      
      // Pulse effect calculation
      const t = state.clock.elapsedTime;
      const pulse = isActive 
        ? Math.sin(t * 10) * 0.15 + 1.15 
        : Math.sin(t * 2 + data.id) * 0.05 + 1; // Subtle idle breathing
      
      const deletePulse = (isDeleteMode && hovered) ? Math.sin(t * 30) * 0.2 + 1.2 : 1;
      
      const finalScale = targetScale * pulse * deletePulse;
      
      localRef.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.1);
    }
  });

  return (
    <Sphere
      ref={localRef}
      position={data.position} 
      args={[1, 32, 32]}
      onClick={(e) => {
        if (isDimmed) return;
        e.stopPropagation();
        onClick(data.id);
      }}
      onPointerOver={(e) => {
        if (isDimmed) return;
        e.stopPropagation();
        setHovered(true);
        onHover(data.id);
      }}
      onPointerOut={(e) => {
        setHovered(false);
        onHover(null);
      }}
      material={material}
    />
  );
});

// --- Connection Component ---
interface ConnectionProps {
  startNode: NodeData;
  endNode: NodeData;
  isActive: boolean;
  isDimmed?: boolean;
}

export const Connection: React.FC<ConnectionProps> = ({ startNode, endNode, isActive, isDimmed }) => {
  // Using native line primitive for maximum stability and performance
  const lineRef = useRef<THREE.Line>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  const effectiveDim = isDimmed && !isActive;

  // Dynamic color for connections
  const color = useMemo(() => {
      if (isActive) return new THREE.Color('#ffffff');
      if (effectiveDim) return new THREE.Color('#1e293b');
      return new THREE.Color('#475569');
  }, [isActive, effectiveDim]);
  
  const opacity = isActive ? 0.8 : (effectiveDim ? 0.05 : 0.2);

  // Initial buffer
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
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        depthWrite={false}
        toneMapped={false}
        linewidth={1} 
      />
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

  if (!sourceNode || !targetNode) return null;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerpVectors(sourceNode.position, targetNode.position, particle.progress);
      // Scale effect based on progress to simulate pulse
      const scale = Math.sin(particle.progress * Math.PI) * 0.08 + 0.02;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 8, 8]}>
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </Sphere>
  );
};