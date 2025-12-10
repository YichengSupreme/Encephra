import * as THREE from 'three';

export type NodeCategory = 'concept' | 'project' | 'person' | 'archive' | 'feature' | 'default';

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
  progress: number;
  speed: number;
}

export interface GraphState {
  nodes: NodeData[];
  links: LinkData[];
}