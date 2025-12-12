import * as THREE from 'three';
import { GraphState, NodeData, LinkData } from '../types';

export const getDemoGraph = (): GraphState => {
  const nodes: NodeData[] = [
    // --- CLUSTER 0: GUIDE (Center) ---
    {
      id: 0,
      position: new THREE.Vector3(0, 0, 0),
      connections: [],
      activity: 0,
      title: "Welcome to Ensephra",
      content: `# Welcome to Ensephra\n\nThis is a **spatial knowledge graph** designed to visualize your thoughts as a living neural network.\n\n### How to Navigate\n- **Left Click + Drag**: Rotate Camera\n- **Right Click + Drag**: Pan Camera\n- **Scroll**: Zoom in/out\n- **Click Node**: Focus and Edit\n\nTry exploring the connected nodes to learn more!`,
      category: 'concept',
      tags: ['guide', 'welcome'],
      created_at: new Date().toISOString()
    },
    {
      id: 1,
      position: new THREE.Vector3(3, 4, 2),
      connections: [],
      activity: 0,
      title: "Markdown Support",
      content: `# Rich Text Editing\n\nYour thoughts support **Markdown** formatting.\n\n- Lists (like this one)\n- **Bold** and *Italic* text\n- [ ] Checkboxes for tasks\n- Code blocks\n\n> "The medium is the message."\n\nYou can even drag and drop images directly into this panel!`,
      category: 'feature',
      tags: ['markdown', 'editor'],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      position: new THREE.Vector3(-3, 4, -2),
      connections: [],
      activity: 0,
      title: "Local-First",
      content: `# Privacy by Design\n\nNeuroFlow is **Local-First software**.\n\n- All data is stored in your browser's \`Local Storage\`.\n- No data is sent to the cloud.\n- You own your neural network.\n\n*Note: Clearing your browser cache will wipe this universe.*`,
      category: 'concept',
      tags: ['privacy', 'data'],
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      position: new THREE.Vector3(0, -5, 5),
      connections: [],
      activity: 0,
      title: "Interactive Physics",
      content: `# Living Graph\n\nThis isn't just a static chart. It's a physics simulation.\n\n- **Clustering**: Nodes with the same tags attract each other.\n- **Signals**: Clicking a node fires a neural impulse along its connections.\n- **Entropy**: Try the "Reset Universe" button to see the system decay and be reborn.`,
      category: 'concept',
      tags: ['physics', 'simulation'],
      created_at: new Date().toISOString()
    },

    // --- CLUSTER 1: ARTIFICIAL INTELLIGENCE (Right/Top) ---
    {
      id: 10,
      position: new THREE.Vector3(20, 5, 5),
      connections: [],
      activity: 0,
      title: "Artificial Intelligence",
      content: `# Artificial Intelligence\n\nThe simulation of human intelligence processes by machines, especially computer systems.`,
      category: 'concept',
      tags: ['ai', 'tech'],
      created_at: new Date().toISOString()
    },
    {
      id: 11,
      position: new THREE.Vector3(25, 8, 8),
      connections: [],
      activity: 0,
      title: "Neural Networks",
      content: `# Neural Networks\n\nComputing systems inspired by the biological neural networks that constitute animal brains.\n\nThey learn to perform tasks by considering examples, generally without being programmed with task-specific rules.`,
      category: 'concept',
      tags: ['ai', 'math'],
      created_at: new Date().toISOString()
    },
    {
      id: 12,
      position: new THREE.Vector3(22, 2, 10),
      connections: [],
      activity: 0,
      title: "Large Language Models",
      content: `# LLMs\n\nA type of AI algorithm that uses deep learning techniques and vastly large data sets to understand, summarize, generate, and predict new content.`,
      category: 'concept',
      tags: ['ai', 'nlp'],
      created_at: new Date().toISOString()
    },
    {
      id: 13,
      position: new THREE.Vector3(28, 6, 2),
      connections: [],
      activity: 0,
      title: "Transformers",
      content: `# The Transformer Architecture\n\nIntroduced in the paper "Attention Is All You Need" (2017).\n\nIt relies on the **self-attention** mechanism to weigh the significance of different parts of the input data.`,
      category: 'concept',
      tags: ['ai', 'tech'],
      created_at: new Date().toISOString()
    },
    {
      id: 14,
      position: new THREE.Vector3(18, 10, 0),
      connections: [],
      activity: 0,
      title: "AGI",
      content: `# Artificial General Intelligence\n\nThe hypothetical ability of an intelligent agent to understand or learn any intellectual task that a human being can.\n\n> "The singularity is near."`,
      category: 'concept',
      tags: ['ai', 'future'],
      created_at: new Date().toISOString()
    },
    {
      id: 15,
      position: new THREE.Vector3(24, -2, 6),
      connections: [],
      activity: 0,
      title: "Generative Art",
      content: `# Generative Art\n\nArt that in whole or in part has been created with the use of an autonomous system.\n\nTools: Midjourney, Stable Diffusion, DALL-E.`,
      category: 'project',
      tags: ['ai', 'art'],
      created_at: new Date().toISOString()
    },

    // --- CLUSTER 2: NEUROSCIENCE (Left/Top) ---
    {
      id: 20,
      position: new THREE.Vector3(-20, 5, 5),
      connections: [],
      activity: 0,
      title: "Neuroscience",
      content: `# Neuroscience\n\nThe scientific study of the nervous system.\n\nIt is a multidisciplinary science that combines physiology, anatomy, molecular biology, developmental biology, cytology, computer science and mathematical modeling.`,
      category: 'concept',
      tags: ['neuroscience', 'biology'],
      created_at: new Date().toISOString()
    },
    {
      id: 21,
      position: new THREE.Vector3(-25, 8, 2),
      connections: [],
      activity: 0,
      title: "Biological Neurons",
      content: `# Neurons\n\nThe fundamental units of the brain and nervous system.\n\nResponsible for receiving sensory input from the external world and sending motor commands to our muscles.`,
      category: 'concept',
      tags: ['neuroscience', 'biology'],
      created_at: new Date().toISOString()
    },
    {
      id: 22,
      position: new THREE.Vector3(-22, 2, 8),
      connections: [],
      activity: 0,
      title: "Synaptic Plasticity",
      content: `# Plasticity\n\nThe ability of synapses to strengthen or weaken over time, in response to increases or decreases in their activity.\n\n> "Neurons that fire together, wire together."`,
      category: 'concept',
      tags: ['neuroscience', 'memory'],
      created_at: new Date().toISOString()
    },
    {
      id: 23,
      position: new THREE.Vector3(-18, 10, 8),
      connections: [],
      activity: 0,
      title: "Dopamine",
      content: `# Dopamine\n\nA type of neurotransmitter. Your body makes it, and your nervous system uses it to send messages between nerve cells.\n\nOften associated with the **reward system**.`,
      category: 'concept',
      tags: ['neuroscience', 'chemistry'],
      created_at: new Date().toISOString()
    },
    {
      id: 24,
      position: new THREE.Vector3(-28, 4, 6),
      connections: [],
      activity: 0,
      title: "Hippocampus",
      content: `# Hippocampus\n\nA complex brain structure embedded deep into temporal lobe. It has a major role in learning and memory.\n\nDamaging this area can result in the inability to form new memories.`,
      category: 'concept',
      tags: ['neuroscience', 'memory'],
      created_at: new Date().toISOString()
    },

    // --- CLUSTER 3: LORD OF THE RINGS (Back/Center) ---
    {
      id: 30,
      position: new THREE.Vector3(0, 15, -15),
      connections: [],
      activity: 0,
      title: "Middle-earth",
      content: `# Middle-earth\n\nThe fictional setting of much of the J. R. R. Tolkien's legendarium.\n\nHome to Elves, Dwarves, Men, and Hobbits.`,
      category: 'concept',
      tags: ['fantasy', 'literature'],
      created_at: new Date().toISOString()
    },
    {
      id: 31,
      position: new THREE.Vector3(-5, 18, -20),
      connections: [],
      activity: 0,
      title: "The One Ring",
      content: `# The One Ring\n\n> "One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them."\n\nForged by the Dark Lord Sauron in the fires of Mount Doom.`,
      category: 'concept',
      tags: ['fantasy', 'artifact'],
      created_at: new Date().toISOString()
    },
    {
      id: 32,
      position: new THREE.Vector3(5, 18, -20),
      connections: [],
      activity: 0,
      title: "Gandalf",
      content: `# Gandalf\n\nA wizard, member of the Istari order, and leader of the Fellowship of the Ring.\n\nAlso known as:\n- Mithrandir\n- The Grey Pilgrim\n- The White Rider`,
      category: 'person',
      tags: ['fantasy', 'character'],
      created_at: new Date().toISOString()
    },
    {
      id: 33,
      position: new THREE.Vector3(0, 12, -22),
      connections: [],
      activity: 0,
      title: "Frodo Baggins",
      content: `# Frodo Baggins\n\nA hobbit of the Shire who inherits the One Ring from his cousin Bilbo Baggins and undertakes the quest to destroy it in the fires of Mount Doom.`,
      category: 'person',
      tags: ['fantasy', 'character'],
      created_at: new Date().toISOString()
    },
    {
      id: 34,
      position: new THREE.Vector3(8, 14, -18),
      connections: [],
      activity: 0,
      title: "Sauron",
      content: `# Sauron\n\nThe title character and the primary antagonist of J. R. R. Tolkien's The Lord of the Rings.\n\nA fallen Maia, creator of the One Ring.`,
      category: 'person',
      tags: ['fantasy', 'villain'],
      created_at: new Date().toISOString()
    },
    {
      id: 35,
      position: new THREE.Vector3(-8, 14, -18),
      connections: [],
      activity: 0,
      title: "The Shire",
      content: `# The Shire\n\nA region of Middle-earth inhabited exclusively by Hobbits.\n\nKnown for its peaceful, agricultural society and lack of complex machinery.`,
      category: 'concept',
      tags: ['fantasy', 'location'],
      created_at: new Date().toISOString()
    },

    // --- CLUSTER 4: PHILOSOPHY & MISC (Bottom) ---
    {
      id: 40,
      position: new THREE.Vector3(0, -15, 0),
      connections: [],
      activity: 0,
      title: "Philosophy",
      content: `# Philosophy\n\nThe study of general and fundamental questions, such as those about existence, reason, knowledge, values, mind, and language.`,
      category: 'concept',
      tags: ['philosophy', 'humanities'],
      created_at: new Date().toISOString()
    },
    {
      id: 41,
      position: new THREE.Vector3(5, -18, -5),
      connections: [],
      activity: 0,
      title: "Stoicism",
      content: `# Stoicism\n\nA school of Hellenistic philosophy founded by Zeno of Citium.\n\nIt teaches that virtue, the highest good, is based on knowledge; the wise live in harmony with the divine Reason that governs nature.`,
      category: 'concept',
      tags: ['philosophy', 'ancient'],
      created_at: new Date().toISOString()
    },
    {
      id: 42,
      position: new THREE.Vector3(-5, -18, -5),
      connections: [],
      activity: 0,
      title: "Simulation Hypothesis",
      content: `# Simulation Hypothesis\n\nThe proposal that all of reality, including the Earth and the universe, is in fact an artificial simulation, most likely a computer simulation.`,
      category: 'concept',
      tags: ['philosophy', 'tech'],
      created_at: new Date().toISOString()
    },
    
    // --- TECH STACK (Scattered) ---
    {
      id: 50,
      position: new THREE.Vector3(10, -5, 10),
      connections: [],
      activity: 0,
      title: "React Three Fiber",
      content: `# React Three Fiber\n\nA React renderer for three.js.\n\nIt allows you to build 3D scenes declaratively using reusable components.`,
      category: 'concept',
      tags: ['tech', 'react'],
      created_at: new Date().toISOString()
    },
    {
      id: 51,
      position: new THREE.Vector3(12, -8, 8),
      connections: [],
      activity: 0,
      title: "Graph Theory",
      content: `# Graph Theory\n\nThe study of graphs, which are mathematical structures used to model pairwise relations between objects.\n\nUsed extensively in:\n- Computer Science\n- Biology\n- Social Sciences`,
      category: 'concept',
      tags: ['math', 'tech'],
      created_at: new Date().toISOString()
    }
  ];

  // Helper to safely add links
  const links: LinkData[] = [];
  const addLink = (source: number, target: number) => {
    if (nodes.find(n => n.id === source) && nodes.find(n => n.id === target)) {
        // Update Node Connections
        const sNode = nodes.find(n => n.id === source)!;
        const tNode = nodes.find(n => n.id === target)!;
        
        if (!sNode.connections.includes(target)) sNode.connections.push(target);
        if (!tNode.connections.includes(source)) tNode.connections.push(source);

        // Create Visual Link
        const dist = sNode.position.distanceTo(tNode.position);
        links.push({ id: `${source}-${target}`, source, target, length: dist });
    }
  };

  // --- CONNECTING THE GRAPH ---

  // Guide Cluster
  addLink(0, 1);
  addLink(0, 2);
  addLink(0, 3);
  addLink(1, 50); // Markdown -> React

  // AI Cluster
  addLink(0, 10); // Welcome -> AI
  addLink(10, 11); // AI -> Neural Networks
  addLink(10, 12); // AI -> LLMs
  addLink(10, 14); // AI -> AGI
  addLink(11, 12); // NN -> LLMs
  addLink(11, 13); // NN -> Transformers
  addLink(12, 13); // LLMs -> Transformers
  addLink(12, 15); // LLMs -> Generative Art
  addLink(15, 10); // Art -> AI

  // Neuro Cluster
  addLink(0, 20); // Welcome -> Neuro
  addLink(20, 21); // Neuro -> Neurons
  addLink(21, 22); // Neurons -> Plasticity
  addLink(21, 23); // Neurons -> Dopamine
  addLink(20, 24); // Neuro -> Hippocampus
  addLink(24, 22); // Hippocampus -> Plasticity

  // CROSS-DOMAIN LINKS (The "Interdisciplinary" stuff)
  addLink(11, 21); // Neural Networks (AI) <-> Neurons (Bio)  <-- The classic analogy
  addLink(11, 22); // Neural Networks <-> Plasticity (Learning rates)
  addLink(24, 12); // Hippocampus (Memory) <-> LLMs (Context Window)
  addLink(14, 20); // AGI <-> Neuroscience (Brain emulation)

  // LOTR Cluster
  addLink(0, 30); // Welcome -> Middle Earth
  addLink(30, 31); // Middle Earth -> Ring
  addLink(30, 32); // Middle Earth -> Gandalf
  addLink(30, 35); // Middle Earth -> Shire
  addLink(31, 33); // Ring -> Frodo
  addLink(31, 34); // Ring -> Sauron
  addLink(32, 33); // Gandalf -> Frodo
  addLink(32, 34); // Gandalf -> Sauron (Conflict)
  addLink(33, 35); // Frodo -> Shire

  // Philosophy
  addLink(0, 40); // Welcome -> Philosophy
  addLink(40, 41); // Phil -> Stoicism
  addLink(40, 42); // Phil -> Simulation
  addLink(42, 10); // Simulation -> AI
  addLink(42, 50); // Simulation -> React Three Fiber (Meta!)
  addLink(50, 51); // R3F -> Graph Theory
  addLink(51, 11); // Graph Theory -> Neural Nets

  return { nodes, links };
};