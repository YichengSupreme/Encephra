import * as THREE from 'three';

export type NodeCategory = 'concept' | 'project' | 'person' | 'archive' | 'feature' | 'contradiction' | 'hypothesis' | 'decision' | 'default';

export interface NodeData {
  id: number;
  position: THREE.Vector3;
  connections: number[];
  activity: number;
  
  // Knowledge Management Props
  title: string;
  content: string; // Markdown body
  category: NodeCategory;
  tags: string[];
  created_at: string;
  
  // Source Tracking
  citation?: string; // e.g. "Pg 4", "Smith 23, Fig 1"

  // State flags
  isGhost?: boolean;
}

export interface LinkData {
  id: string; // "source-target"
  source: number;
  target: number;
  length: number;
}

export interface SignalParticle {
  id: string;
  sourceId: number;
  targetId: number;
  startTime: number;
  speed: number;
}

export interface GraphState {
  nodes: NodeData[];
  links: LinkData[];
}