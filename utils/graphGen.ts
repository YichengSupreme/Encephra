import * as THREE from 'three';
import { NodeData, LinkData, GraphState, NodeCategory } from '../types';

const CATEGORIES: NodeCategory[] = ['concept', 'project', 'person', 'archive'];
const SAMPLE_TAGS = ['ai', 'neuroscience', 'react', 'memory', 'future', 'design', 'philosophy'];

const SAMPLE_TITLES = [
  "Neural Plasticity in UI",
  "The Future of Work",
  "Project: Titan",
  "Meeting with Sarah",
  "React Fiber Architecture",
  "Consciousness Uploading",
  "Entropy & Chaos",
  "Design System V2",
  "Gardening Notes",
  "Book List 2024"
];

const getRandomSubset = (arr: string[], count: number) => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateGraph = (nodeCount: number, radius: number, connectionThreshold: number): GraphState => {
  const nodes: NodeData[] = [];
  const links: LinkData[] = [];

  const minRadius = 8; 
  const maxRadius = 25;

  for (let i = 0; i < nodeCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const r = minRadius + (Math.random() * (maxRadius - minRadius)); 
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Mock Content Generation
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const title = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)] + ` ${i}`;

    nodes.push({
      id: i,
      position: new THREE.Vector3(x, y, z),
      connections: [],
      activity: 0,
      title: title,
      content: `# ${title}\n\nThis is a placeholder for your thought. You can write markdown here.\n\n- Idea 1\n- Idea 2\n- [ ] Action item`,
      category: category,
      tags: getRandomSubset(SAMPLE_TAGS, Math.floor(Math.random() * 3)),
      created_at: new Date().toISOString()
    });
  }

  // Link Generation (Same as before)
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dist = nodes[i].position.distanceTo(nodes[j].position);
      if (dist < connectionThreshold) {
        nodes[i].connections.push(j);
        nodes[j].connections.push(i);
        links.push({
          id: `${i}-${j}`,
          source: i,
          target: j,
          length: dist
        });
      }
    }
  }

  // Orphan cleanup
  nodes.forEach((node, i) => {
    if (node.connections.length === 0) {
      let nearestDist = Infinity;
      let nearestIdx = -1;
      nodes.forEach((other, j) => {
        if (i === j) return;
        const dist = node.position.distanceTo(other.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = j;
        }
      });
      if (nearestIdx !== -1) {
        node.connections.push(nearestIdx);
        nodes[nearestIdx].connections.push(i);
        links.push({
          id: `${Math.min(i, nearestIdx)}-${Math.max(i, nearestIdx)}`,
          source: i,
          target: nearestIdx,
          length: nearestDist
        });
      }
    }
  });

  return { nodes, links };
};