import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { NodeData, LinkData } from '../types';
import { getDemoGraph } from '../utils/demoData';

const STORAGE_KEY = 'neuroflow-v1-state';

export const INITIAL_TAG_COLORS: Record<string, string> = {
  // Tech & AI
  'ai': '#ef4444',          // Red
  'tech': '#3b82f6',        // Blue
  'react': '#06b6d4',       // Cyan
  'future': '#ec4899',      // Pink
  'math': '#8b5cf6',        // Violet
  
  // Science
  'neuroscience': '#f97316', // Orange
  'biology': '#10b981',      // Emerald
  'memory': '#8b5cf6',       // Violet
  'chemistry': '#a855f7',    // Purple

  // Fantasy & Arts
  'fantasy': '#eab308',      // Yellow/Gold
  'literature': '#d97706',   // Amber
  'art': '#db2777',          // Pink-600
  'character': '#22c55e',    // Green
  'villain': '#dc2626',      // Red-600
  'artifact': '#fbbf24',     // Amber-400
  
  // Philosophy
  'philosophy': '#6366f1',  // Indigo
  'humanities': '#f43f5e',  // Rose

  // Meta
  'guide': '#cbd5e1',       // Slate-300
  'markdown': '#8b5cf6',    // Violet
  'default': '#64748b'      // Slate
};

// Helper to safely restore Vector3 from JSON object
const hydrateNode = (n: any): NodeData => ({
    ...n,
    // CRITICAL: Prevent NaNs from entering system via corrupt storage
    position: new THREE.Vector3(
        Number.isFinite(n.position?.x) ? n.position.x : (Math.random()-0.5)*10,
        Number.isFinite(n.position?.y) ? n.position.y : (Math.random()-0.5)*10,
        Number.isFinite(n.position?.z) ? n.position.z : (Math.random()-0.5)*10
    ),
    tags: Array.isArray(n.tags) ? n.tags : [], // Safeguard against undefined tags
    connections: Array.isArray(n.connections) ? n.connections : [],
    isGhost: n.isGhost || false,
    category: n.category || 'concept', // EXPLICIT FALLBACK: Ensures shapes persist after import
    citation: n.citation || undefined
});

export const useGraphData = () => {
    // Config State
    const [nodeCount, setNodeCount] = useState<number>(80);
    const [complexity, setComplexity] = useState<number>(5.0);
    const [clusterStrength, setClusterStrength] = useState<number>(0.5);

    // Data State
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);
    const [tagColors, setTagColors] = useState<Record<string, string>>(INITIAL_TAG_COLORS);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Animation State
    const [isResetting, setIsResetting] = useState(false);
    
    // Injection Queue for "Explosion" effect
    const [injectionQueue, setInjectionQueue] = useState<{nodes: NodeData[], links: LinkData[]} | null>(null);
    const injectionRef = useRef<{nodes: NodeData[], links: LinkData[], currentIndex: number} | null>(null);

    // --- Actions ---

    const loadDemo = useCallback(() => {
        const demoData = getDemoGraph();
        setNodes(demoData.nodes);
        setLinks(demoData.links);
        setNodeCount(demoData.nodes.length);
    }, []);

    const spawnOriginNode = useCallback(() => {
        const originNode: NodeData = {
            id: 0,
            position: new THREE.Vector3(0, 0, 0),
            connections: [],
            activity: 0,
            title: "Origin",
            content: "# Origin\n\nThe beginning of a new universe.",
            category: 'concept',
            tags: [],
            created_at: new Date().toISOString()
        };
        setNodes([originNode]);
        setLinks([]);
        setNodeCount(1);
    }, []);

    // 1. Initialize
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                const hydratedNodes = Array.isArray(parsed.nodes) ? parsed.nodes.map(hydrateNode) : [];
                setNodes(hydratedNodes);
                setLinks(Array.isArray(parsed.links) ? parsed.links : []);
                setTagColors(parsed.tagColors || INITIAL_TAG_COLORS);
                setNodeCount(parsed.config?.nodeCount || 80);
                setComplexity(parsed.config?.complexity || 5);
                setClusterStrength(parsed.config?.clusterStrength ?? 0.5);
                console.log("Restored graph from Local Storage");
            } catch (e) {
                console.error("Failed to parse local storage", e);
                loadDemo();
            }
        } else {
            loadDemo();
        }
        setIsLoaded(true);
    }, [loadDemo]);

    // 2. Auto-Save (SAFE MODE)
    useEffect(() => {
        if (!isLoaded || nodes.length === 0 || isResetting || injectionRef.current) return;

        const timeoutId = setTimeout(() => {
            const stateToSave = {
                nodes,
                links,
                tagColors,
                config: { nodeCount, complexity, clusterStrength }
            };
            try {
                // Safety wrapper: If storage is full, we log warning but DO NOT crash the app.
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            } catch (e) {
                console.warn("Local Storage Full - Autosave skipped (App remains functional)", e);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [nodes, links, tagColors, nodeCount, complexity, clusterStrength, isLoaded, isResetting]);

    // 3. Reset Animation Loop
    useEffect(() => {
        if (!isResetting) return;

        const interval = setInterval(() => {
            setNodes(currentNodes => {
                if (currentNodes.length === 0) {
                    clearInterval(interval);
                    setIsResetting(false);
                    localStorage.removeItem(STORAGE_KEY);
                    spawnOriginNode();
                    return [];
                }
                const decayRate = Math.max(1, Math.floor(currentNodes.length * 0.1));
                const survivors = [...currentNodes];
                for(let i=0; i<decayRate; i++) {
                    if (survivors.length === 0) break;
                    const killIndex = Math.floor(Math.random() * survivors.length);
                    survivors.splice(killIndex, 1);
                }
                return survivors;
            });

            setLinks(currentLinks => {
                if (currentLinks.length === 0) return [];
                const decayRate = Math.max(1, Math.floor(currentLinks.length * 0.2));
                const survivors = [...currentLinks];
                for(let i=0; i<decayRate; i++) {
                    if (survivors.length === 0) break;
                    const killIndex = Math.floor(Math.random() * survivors.length);
                    survivors.splice(killIndex, 1);
                }
                return survivors;
            });

        }, 50);

        return () => clearInterval(interval);
    }, [isResetting, spawnOriginNode]);

    // 4. Injection Animation Loop (The Knowledge Explosion)
    useEffect(() => {
        if (!injectionQueue && !injectionRef.current) return;

        // Start injection
        if (injectionQueue) {
            injectionRef.current = {
                nodes: injectionQueue.nodes,
                links: injectionQueue.links,
                currentIndex: 0
            };
            setInjectionQueue(null);
        }

        const interval = setInterval(() => {
            if (!injectionRef.current) return;

            const { nodes: newNodes, links: newLinks, currentIndex } = injectionRef.current;
            
            // Add root node immediately if it's the start
            if (currentIndex === 0) {
                 // Nothing special, just start
            }

            // How many to add this frame?
            // Accelerate slightly
            const batchSize = Math.max(1, Math.floor(currentIndex / 10) + 1);
            const nextIndex = Math.min(currentIndex + batchSize, newNodes.length);
            
            const batchNodes = newNodes.slice(currentIndex, nextIndex);
            
            // Find links relevant to these new nodes OR nodes already added
            const addedNodeIds = new Set(newNodes.slice(0, nextIndex).map(n => n.id));
            const batchLinks = newLinks.filter(l => {
                // Check if this link hasn't been added yet (optimized check needed ideally, but simple filter works for small batch)
                // Actually, just checking if BOTH source and target exist in the currently known universe (state + batch)
                // However, we only want to add links that connect to *currently being added* nodes to avoid re-adding
                const touchesBatch = batchNodes.some(n => n.id === l.source || n.id === l.target);
                // Also ensure both ends exist now
                const sourceExists = addedNodeIds.has(l.source) || nodes.some(n => n.id === l.source);
                const targetExists = addedNodeIds.has(l.target) || nodes.some(n => n.id === l.target);
                return touchesBatch && sourceExists && targetExists;
            });

            if (batchNodes.length > 0) {
                setNodes(prev => [...prev, ...batchNodes]);
                setNodeCount(prev => prev + batchNodes.length);
                
                // Add links carefully to avoid duplicates (though our addLink prevents it, state setter might not)
                setLinks(prev => {
                    const next = [...prev];
                    batchLinks.forEach(l => {
                         if (!next.some(ex => ex.id === l.id)) next.push(l);
                    });
                    return next;
                });

                injectionRef.current.currentIndex = nextIndex;
            } else {
                // Done
                injectionRef.current = null;
                clearInterval(interval);
            }

        }, 150); // 150ms per batch (slower animation)

        return () => clearInterval(interval);

    }, [injectionQueue, nodes]); // Dependency on nodes required for link existence check

    // --- CRUD Operations ---

    const addNode = useCallback((referenceNodeId: number | null) => {
        const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
        let position = new THREE.Vector3(0, 0, 0);
        const refNode = nodes.find(n => n.id === referenceNodeId);

        if (refNode) {
            if (refNode.position instanceof THREE.Vector3) {
                const offset = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(5);
                position.copy(refNode.position).add(offset);
            } else {
                 const pos = refNode.position as any;
                 position.set(pos.x + 2, pos.y, pos.z);
            }
        } else {
            position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        }

        const newNode: NodeData = {
            id: newId,
            position: position,
            connections: [],
            activity: 0,
            title: "New Thought",
            content: "# New Thought\n\nStart typing...",
            category: 'concept',
            tags: [],
            created_at: new Date().toISOString()
        };

        setNodes(prev => [...prev, newNode]);
        
        if (refNode) {
            setLinks(prev => [...prev, {
                id: `${refNode.id}-${newId}`,
                source: refNode.id,
                target: newId,
                length: refNode.position.distanceTo(position)
            }]);
            setNodes(prev => prev.map(n => {
                if (n.id === refNode.id) return { ...n, connections: [...n.connections, newId] };
                if (n.id === newId) return { ...n, connections: [...n.connections, refNode.id] };
                return n;
            }));
        }
        
        setNodeCount(prev => prev + 1);
        return newId; 
    }, [nodes]);

    const updateNode = useCallback((updatedNode: NodeData) => {
        setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    }, []);

    const removeNode = useCallback((id: number) => {
        setNodes(prevNodes => {
            const newNodes = prevNodes.filter(n => n.id !== id);
            return newNodes.map(n => ({
                ...n,
                connections: n.connections.filter(connId => connId !== id)
            }));
        });
        
        setLinks(prevLinks => prevLinks.filter(l => l.source !== id && l.target !== id));
        setNodeCount(prev => prev - 1);
    }, []);

    const toggleConnection = useCallback((sourceId: number, targetId: number) => {
        if (sourceId === targetId) return;

        const existingLink = links.find(l => 
            (l.source === sourceId && l.target === targetId) || 
            (l.source === targetId && l.target === sourceId)
        );

        if (existingLink) {
            // REMOVE
            setLinks(prev => prev.filter(l => l.id !== existingLink.id));
            setNodes(prev => prev.map(n => {
                if (n.id === sourceId) return { ...n, connections: n.connections.filter(id => id !== targetId) };
                if (n.id === targetId) return { ...n, connections: n.connections.filter(id => id !== sourceId) };
                return n;
            }));
        } else {
            // ADD
            const sourceNode = nodes.find(n => n.id === sourceId);
            const targetNode = nodes.find(n => n.id === targetId);
            if (!sourceNode || !targetNode) return;

            const dist = sourceNode.position.distanceTo(targetNode.position);
            setLinks(prev => [...prev, { id: `${sourceId}-${targetId}`, source: sourceId, target: targetId, length: dist }]);
            setNodes(prev => prev.map(n => {
                if (n.id === sourceId) return { ...n, connections: [...n.connections, targetId] };
                if (n.id === targetId) return { ...n, connections: [...n.connections, sourceId] };
                return n;
            }));
        }
    }, [links, nodes]);

    // --- SYNAPTIC SYNTHESIS LOGIC ---
    
    // 1. Create Placeholder Node at Midpoint
    const spawnBridgeNode = useCallback((sourceId: number, targetId: number) => {
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return null;

        const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
        
        // Midpoint calculation
        const midPos = sourceNode.position.clone().add(targetNode.position).multiplyScalar(0.5);

        const bridgeNode: NodeData = {
            id: newId,
            position: midPos,
            connections: [sourceId, targetId],
            activity: 0,
            title: "Synthesizing...",
            content: "Consulting the Cortex...",
            category: 'concept',
            tags: ['_status_gold'], // Triggers Gold Material
            created_at: new Date().toISOString()
        };

        setNodes(prev => [...prev, bridgeNode]);
        setNodeCount(prev => prev + 1);

        // Add connections A <-> Bridge <-> B
        // Note: We deliberately do NOT add A <-> B direct link here.
        setLinks(prev => [
            ...prev, 
            { id: `${sourceId}-${newId}`, source: sourceId, target: newId, length: sourceNode.position.distanceTo(midPos) },
            { id: `${newId}-${targetId}`, source: newId, target: targetId, length: targetNode.position.distanceTo(midPos) }
        ]);

        // Update neighbors
        setNodes(prev => prev.map(n => {
            if (n.id === sourceId && !n.connections.includes(newId)) return { ...n, connections: [...n.connections, newId] };
            if (n.id === targetId && !n.connections.includes(newId)) return { ...n, connections: [...n.connections, newId] };
            return n;
        }));

        return newId;
    }, [nodes]);

    // 2. Resolve the bridge with real data
    const resolveBridgeNode = useCallback((id: number, data: any) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                // SAFEGUARD: Ensure _status_entropy is REMOVED if passed in, to stop physics engine.
                const rawTags = data.tags || [];
                const safeTags = rawTags.filter((t: string) => t !== '_status_entropy');
                const combinedTags = [...safeTags, '_status_gold']; 
                return {
                    ...n,
                    title: data.title,
                    content: data.content,
                    tags: combinedTags
                };
            }
            return n;
        }));

        // 3. Cooldown Timer: Remove gold status after 3 seconds
        setTimeout(() => {
             setNodes(prev => prev.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        tags: n.tags.filter(t => t !== '_status_gold' && t !== '_status_entropy')
                    };
                }
                return n;
             }));
        }, 3000);

    }, []);

    // --- INFERENCE (GAP ANALYSIS) LOGIC ---
    const spawnGhostNodes = useCallback((suggestions: any[], sourceNodes: NodeData[]) => {
        // Calculate Center of Mass of source nodes to spawn ghosts near them
        let center = new THREE.Vector3(0,0,0);
        if (sourceNodes.length > 0) {
            sourceNodes.forEach(n => center.add(n.position));
            center.divideScalar(sourceNodes.length);
        }

        const newNodes: NodeData[] = suggestions.map((s, i) => {
            const newId = (nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) : 0) + i + 1;
            
            // Random offset from center to place in "negative space"
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 10 + Math.random() * 10; // 10-20 units away
            
            const x = center.x + r * Math.sin(phi) * Math.cos(theta);
            const y = center.y + r * Math.sin(phi) * Math.sin(theta);
            const z = center.z + r * Math.cos(phi);

            // Construct rich content from new AI schema
            // If domain/type are missing (backward compat), fallback gracefully
            const domainStr = s.detected_domain ? `**Domain:** \`${s.detected_domain}\` | ` : '';
            const typeStr = s.type ? `**Type:** *${s.type}*\n\n` : '';
            
            let citationsStr = '';
            if (s.citations && Array.isArray(s.citations) && s.citations.length > 0) {
                citationsStr = `\n**References:**\n${s.citations.map((c: string) => `- ${c}`).join('\n')}\n`;
            }

            const content = `### Missing Concept: ${s.title}

${domainStr}${typeStr}**Significance:** ${s.why_it_matters}

**Research Inquiry:** *${s.open_question}*
${citationsStr}
---
*Click to Materialize this node via Cortex AI.*`;

            return {
                id: newId,
                position: new THREE.Vector3(x, y, z),
                connections: [],
                activity: 0,
                title: s.title,
                content: content,
                category: s.category || 'concept', // Use suggested category (e.g., diamond for contradiction)
                tags: ['ghost'],
                created_at: new Date().toISOString(),
                isGhost: true
            };
        });

        setNodes(prev => [...prev, ...newNodes]);
        setNodeCount(prev => prev + newNodes.length);
        
        // Intelligent Linking based on AI suggestion
        const newLinks: LinkData[] = [];
        
        newNodes.forEach((ghost, i) => {
            const suggestion = suggestions[i];
            let hasIntelligentLink = false;

            // Try to link to suggested existing nodes by title
            if (suggestion.connects_to && Array.isArray(suggestion.connects_to)) {
                suggestion.connects_to.forEach((targetTitle: string) => {
                    const targetNode = nodes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
                    if (targetNode) {
                        const dist = ghost.position.distanceTo(targetNode.position);
                        newLinks.push({
                            id: `${targetNode.id}-${ghost.id}`,
                            source: targetNode.id,
                            target: ghost.id,
                            length: dist
                        });
                        ghost.connections.push(targetNode.id);
                        hasIntelligentLink = true;
                    }
                });
            }

            // Fallback: Connect ghosts to random source nodes if no specific links were found or possible
            if (!hasIntelligentLink && sourceNodes.length > 0) {
                const randomSource = sourceNodes[Math.floor(Math.random() * sourceNodes.length)];
                newLinks.push({
                    id: `${randomSource.id}-${ghost.id}`,
                    source: randomSource.id,
                    target: ghost.id,
                    length: 15
                });
                ghost.connections.push(randomSource.id);
            }
        });
            
        setLinks(prev => [...prev, ...newLinks]);
        
        // Update existing nodes with new connections
        setNodes(prev => prev.map(n => {
                const linkedGhosts = newNodes.filter(g => g.connections.includes(n.id));
                if (linkedGhosts.length > 0) {
                    const newIds = linkedGhosts.map(g => g.id).filter(id => !n.connections.includes(id));
                    if (newIds.length > 0) {
                        return { ...n, connections: [...n.connections, ...newIds] };
                    }
                }
                return n;
        }));

    }, [nodes]);

    const startMaterialization = useCallback((id: number) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                return {
                    ...n,
                    isGhost: false, // CRITICAL: This protects the node from removeGhostNodes()
                    title: "Materializing...",
                    // Replace 'ghost' tag with 'materializing' status
                    tags: [...n.tags.filter(t => t !== 'ghost'), '_status_materializing']
                };
            }
            return n;
        }));
    }, []);

    // ERROR HANDLING HELPER: Reverts a materializing node back to ghost state
    const revertMaterialization = useCallback((id: number) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                return {
                    ...n,
                    isGhost: true, // Back to ghost
                    title: "Signal Failed",
                    tags: [...n.tags.filter(t => t !== '_status_materializing'), 'ghost']
                };
            }
            return n;
        }));
    }, []);

    const materializeGhostNode = useCallback((id: number, data: any) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                return {
                    ...n,
                    title: data.title,
                    content: data.content,
                    category: data.category as any,
                    tags: data.tags,
                    citation: data.citation,
                    isGhost: false // Materialized!
                };
            }
            return n;
        }));
    }, []);

    const removeGhostNodes = useCallback(() => {
        setNodes(prevNodes => {
            const ghostIds = new Set(prevNodes.filter(n => n.isGhost).map(n => n.id));
            if (ghostIds.size === 0) return prevNodes;

            const survivors = prevNodes.filter(n => !n.isGhost).map(n => ({
                ...n,
                // Clean connections to ghosts
                connections: n.connections.filter(cId => !ghostIds.has(cId))
            }));
            
            // Clean links
            setLinks(prevLinks => prevLinks.filter(l => !ghostIds.has(l.source) && !ghostIds.has(l.target)));
            setNodeCount(prev => prev - ghostIds.size);
            
            return survivors;
        });
    }, []);


    const updateTagColor = useCallback((tag: string, color: string) => {
        setTagColors(prev => ({ ...prev, [tag.toLowerCase()]: color }));
    }, []);

    const importData = useCallback((data: any) => {
        try {
            if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
                console.error("Invalid file structure");
                return;
            }
            const importedNodes = data.nodes.map(hydrateNode);
            setNodes(importedNodes);
            setLinks(data.links);
            setTagColors(data.tagColors || INITIAL_TAG_COLORS);
            
            if (data.config) {
                setNodeCount(data.config.nodeCount || importedNodes.length);
                setComplexity(data.config.complexity || 5);
                setClusterStrength(data.config.clusterStrength ?? 0.5);
            }
        } catch (e) {
            console.error("Import error:", e);
        }
    }, []);

    const startReset = useCallback(() => setIsResetting(true), []);

    // New Method: Inject AI Data
    const injectGraphCluster = useCallback((aiResponse: any) => {
        // 1. Find max ID
        let currentMaxId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) : 0;
        
        // 2. Prepare Root
        const rootId = currentMaxId + 1;
        const rootNode: NodeData = {
            id: rootId,
            // Center the explosion roughly at origin, maybe slight random offset
            position: new THREE.Vector3((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*5),
            connections: [],
            activity: 0,
            title: aiResponse.rootTitle || "Document Root",
            content: aiResponse.rootSummary || "# Summary\n...",
            category: 'archive', // Force Cube for Root (Source PDF)
            tags: ['source', 'pdf'],
            created_at: new Date().toISOString()
        };

        const newNodes: NodeData[] = [rootNode];
        const newLinks: LinkData[] = [];
        const titleToId = new Map<string, number>();
        titleToId.set(rootNode.title, rootId);

        // 3. Process Children
        if (Array.isArray(aiResponse.nodes)) {
            aiResponse.nodes.forEach((n: any, idx: number) => {
                const id = rootId + 1 + idx;
                
                // Explode outwards: random position in a sphere around root
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 0.5; // Start VERY close, physics will push apart (Explosion effect)
                const x = rootNode.position.x + r * Math.sin(phi) * Math.cos(theta);
                const y = rootNode.position.y + r * Math.sin(phi) * Math.sin(theta);
                const z = rootNode.position.z + r * Math.cos(phi);

                newNodes.push({
                    id: id,
                    position: new THREE.Vector3(x,y,z),
                    connections: [],
                    activity: 0,
                    title: n.title,
                    content: n.description || `# ${n.title}`,
                    category: 'concept', // Force Sphere for children
                    tags: n.tags || [],
                    citation: n.citation,
                    created_at: new Date().toISOString()
                });
                titleToId.set(n.title, id);
            });
        }

        // 4. Process Links
        newNodes.slice(1).forEach(child => {
            if (Math.random() > 0.3) {
                newLinks.push({
                    id: `${rootId}-${child.id}`,
                    source: rootId,
                    target: child.id,
                    length: 10
                });
                rootNode.connections.push(child.id);
                child.connections.push(rootId);
            }
        });

        if (Array.isArray(aiResponse.relationships)) {
            aiResponse.relationships.forEach((rel: any) => {
                const sId = titleToId.get(rel.source);
                const tId = titleToId.get(rel.target);
                if (sId && tId) {
                    newLinks.push({
                        id: `${sId}-${tId}`,
                        source: sId,
                        target: tId,
                        length: 10
                    });
                    
                    const sNode = newNodes.find(n => n.id === sId);
                    const tNode = newNodes.find(n => n.id === tId);
                    if (sNode && !sNode.connections.includes(tId)) sNode.connections.push(tId);
                    if (tNode && !tNode.connections.includes(sId)) tNode.connections.push(sId);
                }
            });
        }

        setInjectionQueue({ nodes: newNodes, links: newLinks });

    }, [nodes]);

    // SPECIALIZED RESEARCH INJECTION
    const injectResearchUniverse = useCallback((aiResponse: any) => {
        let currentMaxId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) : 0;
        const newNodes: NodeData[] = [];
        const newLinks: LinkData[] = [];
        const titleToId = new Map<string, number>();

        const rawNodes = aiResponse.nodes || [];
        
        // 1. Identify and Place 'archive' (Source Paper) nodes first
        // They form a central ring
        const archiveNodes = rawNodes.filter((n: any) => n.category === 'archive');
        const conceptNodes = rawNodes.filter((n: any) => n.category !== 'archive');

        const archiveRadius = 10;
        archiveNodes.forEach((n: any, idx: number) => {
            const id = ++currentMaxId;
            const theta = (idx / archiveNodes.length) * Math.PI * 2;
            const x = Math.cos(theta) * archiveRadius;
            const z = Math.sin(theta) * archiveRadius;
            
            const node: NodeData = {
                id,
                position: new THREE.Vector3(x, 0, z),
                connections: [],
                activity: 0,
                title: n.title,
                content: n.content,
                category: 'archive',
                tags: n.tags || ['source'],
                citation: n.citation,
                created_at: new Date().toISOString()
            };
            newNodes.push(node);
            titleToId.set(n.title, id);
        });

        // 2. Place Concepts (Explode from center or related paper)
        conceptNodes.forEach((n: any) => {
            const id = ++currentMaxId;
            // Spawn near origin but random
            const pos = new THREE.Vector3((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*5);
            
            const node: NodeData = {
                id,
                position: pos,
                connections: [],
                activity: 0,
                title: n.title,
                content: n.content,
                category: n.category || 'concept',
                tags: n.tags || [],
                citation: n.citation,
                created_at: new Date().toISOString()
            };
            newNodes.push(node);
            titleToId.set(n.title, id);
        });

        // 3. Links
        if (Array.isArray(aiResponse.links)) {
            aiResponse.links.forEach((link: any) => {
                const sId = titleToId.get(link.source);
                const tId = titleToId.get(link.target);
                
                if (sId && tId) {
                    newLinks.push({
                        id: `${sId}-${tId}`,
                        source: sId,
                        target: tId,
                        length: 15
                    });
                    const s = newNodes.find(x => x.id === sId);
                    const t = newNodes.find(x => x.id === tId);
                    if (s) s.connections.push(tId);
                    if (t) t.connections.push(sId);
                }
            });
        }

        setInjectionQueue({ nodes: newNodes, links: newLinks });

    }, [nodes]);

    return {
        // State
        nodes,
        links,
        tagColors,
        nodeCount,
        clusterStrength,
        isResetting,
        
        // Actions
        setClusterStrength,
        addNode,
        updateNode,
        removeNode,
        toggleConnection,
        updateTagColor,
        importData,
        startReset,
        loadDemo,
        injectGraphCluster,
        injectResearchUniverse,
        // Synthesis Actions
        spawnBridgeNode,
        resolveBridgeNode,
        // Gap Analysis Actions
        spawnGhostNodes,
        materializeGhostNode,
        removeGhostNodes,
        startMaterialization,
        revertMaterialization // EXPORTED
    };
};