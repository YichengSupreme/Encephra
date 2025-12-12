import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NodeData } from "../types";

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelFlash = 'gemini-2.5-flash';
  private modelPro = 'gemini-3-pro-preview';

  initialize(apiKey: string) {
    if (!apiKey) return;
    this.ai = new GoogleGenAI({ apiKey });
    console.log("🧠 Cortex Uplink Established (Gemini API Initialized)");
  }

  isReady(): boolean {
    return !!this.ai;
  }

  async generateSimple(prompt: string): Promise<string> {
    if (!this.ai) throw new Error("Cortex Offline: API Key missing.");
    
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelFlash,
        contents: prompt,
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async generateThinking(prompt: string): Promise<string> {
    if (!this.ai) throw new Error("Cortex Offline: API Key missing.");

    try {
      // Using Pro model for complex reasoning tasks
      const response = await this.ai.models.generateContent({
        model: this.modelPro,
        contents: prompt,
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  private getPromptForMode(mode: 'flash' | 'focus' | 'insight'): string {
    const baseInstruction = `
      ROLE: You are Encephra, a Neural Topology Engine.
      INPUT: A scientific or technical document.
      OUTPUT: A structured Knowledge Graph (JSON) with 'nodes' and 'links'.
      CONSTRAINT: Node titles must be short, high-impact scientific terms (1-4 words).
      CITATION RULE: Always try to include the Author's Name or Document Identifier in citations (e.g., "Smith, Pg 4", "ISO 9001, Sec 2").
    `;
  
    switch (mode) {
      case 'flash':
        return `
          ${baseInstruction}
          MODE: FLASH (High-Velocity Skeleton).
          GOAL: Extract only the "Spine" of the document.
          
          INSTRUCTIONS:
          1. IDENTIFY the Single Central Thesis (Root Node).
          2. EXTRACT 4-12 Primary Pillars (Direct children of Root).
          3. Prioritize big ideas and key relationships over details, examples, and minor data.
          4. CITATIONS: Format as "Author/ID + Loc" (e.g. "Miller, Pg 1", "RFC 123, Intro").
          5. TOPOLOGY: Hub-and-Spoke (Star).
          
          JSON STRUCTURE:
          - Limit to max 12 nodes.
          - Focus on hierarchy.
          - Tags should be broad categories (e.g., #Neuroscience, #Physics).
        `;
  
      case 'focus':
        return `
          ${baseInstruction}
          MODE: FOCUS (Structural Integrity).
          GOAL: Build a balanced map of concepts and their functional relationships.
          
          INSTRUCTIONS:
          1. MAP the Core Concepts (15-35 nodes).
          2. IDENTIFY "Bridge Concepts" that link distinct sections of the paper.
          3. CITATIONS: Format as "Author/ID + Loc" (e.g. "Miller, Pg 12", "ISO, Sec 3").
          4. DEFINE relationships clearly: "inhibits", "potentiates", "correlates_with".
          5. TOPOLOGY: Balanced Mesh (Interconnected clusters).
          
          JSON STRUCTURE:
          - Nodes must have a 'content' field with a 1-sentence definition.
          - Use precise tags (e.g., #SynapticPlasticity, #GradientDescent).
        `;
  
      case 'insight':
        return `
          ${baseInstruction}
          MODE: INSIGHT (Deep Latent Space).
          GOAL: Uncover hidden connections, edge cases, and theoretical implications.
          
          INSTRUCTIONS:
          1. EXPLODE the document into 40-60 granular concept nodes.
          2. INFER relationships that are implied but not explicitly stated.
          3. FIND Hidden Themes or Tension Points within the logic.
          4. IDENTIFY unproven theories or future directions.
          5. CITATIONS: Format as "Author/ID + Loc" (e.g. "Miller, Fig 3", "Eq 2").
          6. TOPOLOGY: Dense Neural Network (High connectivity).
          
          JSON STRUCTURE:
          - Tags should include methodology and abstract concepts (e.g., #Epistemology, #CausalInference).
        `;
        
      default:
        return baseInstruction;
    }
  }

  async processDocument(
      fileBase64: string, 
      mimeType: string, 
      mode: 'flash' | 'focus' | 'insight'
  ): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline: API Key missing.");

      let nodeCount = 10;
      switch(mode) {
          case 'flash': nodeCount = 12; break;
          case 'focus': nodeCount = 30; break;
          case 'insight': nodeCount = 50; break;
      }

      const promptText = this.getPromptForMode(mode);

      // RESTRICTED SCHEMA: Removed special shapes.
      // Ensure all extracted nodes are strictly 'concept' (Spheres).
      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              rootTitle: { type: Type.STRING, description: "The main title/theme of the document" },
              rootSummary: { type: Type.STRING, description: "A markdown summary of the entire document" },
              nodes: {
                  type: Type.ARRAY,
                  description: `List of approx ${nodeCount} concept nodes extracted from the text`,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING, description: "Markdown content for this concept" },
                          category: { 
                              type: Type.STRING, 
                              enum: ['concept'], 
                              description: "Always use 'concept' for extracted nodes to ensure standard spherical representation."
                          },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                          citation: { 
                            type: Type.STRING, 
                            description: "Location citation. Include Author/Source if possible. E.g. 'Smith 23, Pg 4', 'Nature, Fig 2'. Max 15 chars." 
                          }
                      },
                      required: ['title', 'description', 'category', 'tags']
                  }
              },
              relationships: {
                  type: Type.ARRAY,
                  description: "Conceptual links between the extracted nodes",
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          source: { type: Type.STRING, description: "Title of the source node" },
                          target: { type: Type.STRING, description: "Title of the target node" }
                      },
                      required: ['source', 'target']
                  }
              }
          },
          required: ['rootTitle', 'rootSummary', 'nodes', 'relationships']
      };

      try {
          // Use Pro model for Insight mode to handle the complexity
          const modelName = mode === 'insight' ? this.modelPro : this.modelFlash;

          const response = await this.ai.models.generateContent({
              model: modelName,
              contents: {
                  parts: [
                      { inlineData: { mimeType: mimeType, data: fileBase64 } },
                      { text: promptText }
                  ]
              },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });

          const text = response.text;
          if (!text) throw new Error("No data returned from Gemini");
          
          return JSON.parse(text);

      } catch (error) {
          console.error("Gemini PDF Processing Error:", error);
          throw error;
      }
  }

  // --- PROTOCOL OCCIPITAL (Visual Cortex) ---
  async analyzeVisualGraph(imageBase64: string, mimeType: string): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline");

      const prompt = `
        TASK: PROTOCOL OCCIPITAL [VISION ANALYSIS]
        
        Analyze this image (diagram, chart, sketch, or mind map).
        Deconstruct it into a semantic Knowledge Graph.
        
        1. **NODES**: Identify every distinct labeled component, step, or entity in the image.
        2. **EDGES**: Identify arrows, lines, or spatial proximity connecting them. If A points to B, link them.
        3. **SHAPES**: If you see decision diamonds, label them as 'decision'.
        
        Generate a graph structure.
      `;

      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              rootTitle: { type: Type.STRING, description: "Title of the visual system depicted" },
              rootSummary: { type: Type.STRING, description: "Summary of what this diagram represents" },
              nodes: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING, description: "Label found in image" },
                          description: { type: Type.STRING, description: "Description or inferred function based on visual context" },
                          // SPECIAL SHAPES ALLOWED HERE
                          category: { type: Type.STRING, enum: ['concept', 'feature', 'project', 'decision'] },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['title', 'description', 'category', 'tags']
                  }
              },
              relationships: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          source: { type: Type.STRING, description: "Exact title of source node" },
                          target: { type: Type.STRING, description: "Exact title of target node" }
                      },
                      required: ['source', 'target']
                  }
              }
          },
          required: ['rootTitle', 'rootSummary', 'nodes', 'relationships']
      };

      try {
          const response = await this.ai.models.generateContent({
              model: this.modelFlash,
              contents: {
                  parts: [
                      { inlineData: { mimeType: mimeType, data: imageBase64 } },
                      { text: prompt }
                  ]
              },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });
          
          const text = response.text;
          if (!text) throw new Error("Visual Analysis Failed");
          
          // Inject 'visual' tag for styling
          const data = JSON.parse(text);
          if (data.nodes) {
              data.nodes = data.nodes.map((n: any) => ({
                  ...n,
                  tags: [...(n.tags || []), 'visual', 'occipital']
              }));
          }
          return data;

      } catch (error) {
          console.error("Occipital Error:", error);
          throw error;
      }
  }

  async synthesizeResearch(files: { data: string, mimeType: string, name: string }[]): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline: API Key missing.");
      
      const parts = files.map(f => ({
          inlineData: { mimeType: f.mimeType, data: f.data }
      }));

      const promptText = `
        You are Encephra, an advanced neural synthesis engine.
        
        TASK: Perform a Comparative Meta-Analysis of these ${files.length} scientific documents.
        Build a Unified Knowledge Graph representing the "Universe" of this research.

        STRUCTURE:
        1. **Source Nodes**: Create a node for each paper (Category: 'archive').
        2. **Core Concepts**: Extract key entities/theories (Category: 'concept').
        3. **Cross-Paper Relationships**:
           - **Shared Pathways**: If multiple papers discuss X, link them to X.
           - **Contradictions**: If papers disagree, create a node titled "Conflict: [Topic]" (Category: 'contradiction').
           - **Hypotheses**: If you infer a connection not explicitly stated, create a node (Category: 'hypothesis').

        OUTPUT RULES:
        - Identify at least 3 shared concepts.
        - Identify any contradictions or divergent findings.
        - CITATIONS: For every node, provide a 'citation' string. Format: "[Source] [Location]", e.g., "Smith 23, p.4" or "Nature, Fig 1". Keep strictly under 15 chars.
      `;

      // Add prompt to parts
      parts.push({ text: promptText } as any);

      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              synthesis_summary: { type: Type.STRING, description: "Global summary of the research cluster" },
              nodes: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING },
                          content: { type: Type.STRING, description: "Markdown body" },
                          // EXPANDED: Included specialized categories for shape rendering
                          category: { 
                              type: Type.STRING, 
                              enum: ['concept', 'archive', 'contradiction', 'hypothesis'],
                              description: "Use 'archive' for papers, 'contradiction' for conflicts, 'hypothesis' for inferred theories."
                          },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                          citation: { 
                             type: Type.STRING, 
                             description: "Brief citation. Format: 'Source Name + Location'. E.g. 'Smith, p.12'. Max 15 chars."
                          },
                          source_paper_index: { type: Type.NUMBER, description: "Index of the file this node primarily comes from (if applicable), -1 otherwise" }
                      },
                      required: ['title', 'content', 'category', 'tags']
                  }
              },
              links: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          source: { type: Type.STRING },
                          target: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ['supports', 'contradicts', 'mentions', 'hypothesizes'] }
                      },
                      required: ['source', 'target']
                  }
              }
          },
          required: ['synthesis_summary', 'nodes', 'links']
      };

      try {
          // Use Pro model for heavy context window tasks
          const response = await this.ai.models.generateContent({
              model: this.modelPro,
              contents: { parts },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });

          const text = response.text;
          if (!text) throw new Error("Research Synthesis Failed");
          return JSON.parse(text);

      } catch (error) {
          console.error("Gemini Research Mode Error:", error);
          throw error;
      }
  }

  // ... (Rest of service remains the same)
  async synthesizeConnection(nodeA: NodeData, nodeB: NodeData): Promise<any> {
    if (!this.ai) throw new Error("Cortex Offline");

    const prompt = `
      I have two concepts in my knowledge graph. 
      Node A: "${nodeA.title}" - Content preview: ${nodeA.content.substring(0, 200)}...
      Node B: "${nodeB.title}" - Content preview: ${nodeB.content.substring(0, 200)}...

      Synthesize a "Bridge Concept" that explains the scientific, thematic, or logical link between them.
      The title should be the name of this connecting concept.
      The content should explain HOW they are connected.
      Assign relevant tags.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the bridge concept" },
        content: { type: Type.STRING, description: "Explanation of the connection in markdown" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'content', 'tags']
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelFlash,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No synthesis generated");
      return JSON.parse(text);
    } catch (error) {
      console.error("Synaptic Synthesis Failed:", error);
      throw error;
    }
  }

  async synthesizeEntropy(nodeA: NodeData, nodeB: NodeData): Promise<any> {
    if (!this.ai) throw new Error("Cortex Offline");

    const prompt = `
      CORE DIRECTIVE: ENTROPY MODE.
      
      Force a creative, speculative, or high-entropy connection between these two seemingly unrelated nodes.
      Relax all structural priors. Be poetic, philosophical, abstract, or quantum.
      
      Node A: "${nodeA.title}"
      Node B: "${nodeB.title}"

      Generate a concept that represents the collision of these two ideas.
      The "Title" should be abstract or metaphorical.
      The "Content" should explain this weird connection.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Abstract title of the collision concept" },
        content: { type: Type.STRING, description: "Speculative explanation of the connection" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'content', 'tags']
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelPro,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 1.2, // High temperature for creativity
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Entropy synthesis failed");
      return JSON.parse(text);
    } catch (error) {
      console.error("Entropy Synthesis Failed:", error);
      throw error;
    }
  }

  async generateEngram(nodes: NodeData[], depth: 'trace' | 'engram' | 'consolidation'): Promise<any> {
    if (!this.ai) throw new Error("Cortex Offline");

    const nodeList = nodes.map(n => `- ${n.title}: ${n.content.substring(0, 100)}...`).join('\n');
    
    let instructions = "";
    if (depth === 'trace') {
        instructions = "Write a 'Trace'. This is a highly concise, 1-2 sentence summary that captures the immediate connection between these items.";
    } else if (depth === 'engram') {
        instructions = "Write an 'Engram'. This is a stabilized memory signature. Write a 2-paragraph summary that explains the relationship and meaning of this cluster.";
    } else {
        instructions = "Write a 'Consolidation'. This is a deep, structured understanding. Write a detailed analysis (approx 3-4 paragraphs) explaining how these concepts combine to form a larger system or truth.";
    }

    const prompt = `
      Here is a cluster of concepts from a knowledge graph:
      ${nodeList}

      ${instructions}
      
      Also provide a cryptic but insightful "Engram ID" (a short title for this cluster).
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The Engram ID (Title)" },
            summary: { type: Type.STRING, description: "The generated summary content" }
        },
        required: ['title', 'summary']
    };

    try {
        const response = await this.ai.models.generateContent({
            model: this.modelPro, 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) throw new Error("Engram synthesis failed");
        return JSON.parse(text);
    } catch (error) {
        console.error("Engram Error:", error);
        throw error;
    }
  }

  async analyzeGaps(nodes: NodeData[]): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline");

      const nodeList = nodes.map(n => `- ${n.title} (Tags: ${n.tags.join(', ')})`).join('\n');
      
      const prompt = `
        You are the ENCEPHRA OMNI-REASONING ENGINE.

        Your goal is to analyze the user's knowledge graph, DETECT the intellectual domain, and generate high-value "Ghost Nodes" (missing concepts) using the appropriate reasoning framework.

        [INPUT CONTEXT]
        The user has provided a list of Node Titles & Tags:
        ${nodeList}

        [PHASE 1: DOMAIN DETECTION]
        Analyze the input nodes to determine the dominant field of study:
        - **Hard Sciences (Bio/Phys/Chem):** Focus on CAUSALITY, MECHANISMS, and EMPIRICAL GAPS.
        - **Social Sciences (Econ/Pol/Geog):** Focus on SYSTEMS, INCENTIVES, GEOPOLITICS, and SECOND-ORDER EFFECTS.
        - **Humanities (Hist/Phil/Lit):** Focus on THEMES, CONTEXT, INTERPRETATION, and SYNTHESIS.
        - **Mixed/Interdisciplinary:** Focus on BRIDGING CONCEPTS and INTEGRATIVE FRAMEWORKS.

        [PHASE 2: GENERATION MISSION]
        Identify 3 critical concepts that are truly missing from this specific cluster.

        [ADAPTIVE CONSTRAINTS]
        1. **If Economics/Politics:** Look for "Perverse Incentives," "Market Failures," "Regulatory Gaps," or "Power Dynamics."
        2. **If Science:** Look for "Missing Links," "Causal Mechanisms," or "Confounding Variables."
        3. **If Humanities:** Look for "Philosophical Underpinnings," "Historical Precedents," or "Critical Lenses."

        [OUTPUT RULES]
        Return 3 "Ghost Nodes" representing this negative space.
      `;

      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              ghostNodes: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING },
                          type: { type: Type.STRING, description: "The specific relationship type (e.g., 'Economic Incentive', 'Causal Mechanism', 'Thematic Lens')" },
                          detected_domain: { type: Type.STRING, description: "The field you identified (e.g., 'Macroeconomics', 'Cellular Biology')" },
                          why_it_matters: { type: Type.STRING, description: "Explain the importance using the VOCABULARY of that domain." },
                          open_question: { type: Type.STRING, description: "A provocative question that pushes the research forward." },
                          connects_to: { 
                              type: Type.ARRAY, 
                              items: { type: Type.STRING },
                              description: "Exact titles of existing nodes this connects to"
                          },
                          // We use this 'category' field to determine if the ghost is a diamond/crystal etc.
                          category: { 
                              type: Type.STRING, 
                              enum: ['concept', 'contradiction', 'hypothesis'],
                              description: "Choose 'contradiction' if it represents a conflict/gap, 'hypothesis' if it's a theory, otherwise 'concept'."
                          },
                          citations: {
                               type: Type.ARRAY,
                               items: { type: Type.STRING },
                               description: "Optional: Relevant theorists, papers, or year (e.g., 'Author, Year'). Return empty array if none."
                          }
                      },
                      required: ['title', 'type', 'detected_domain', 'why_it_matters', 'open_question', 'connects_to', 'category', 'citations']
                  }
              }
          },
          required: ['ghostNodes']
      };

      try {
          const response = await this.ai.models.generateContent({
              model: this.modelPro,
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });
          
          const text = response.text;
          if (!text) throw new Error("Gap Analysis Failed");
          return JSON.parse(text);
      } catch (error) {
          console.error("Inference Error:", error);
          throw error;
      }
  }

  async materializeGhost(ghostTitle: string, contextNodes: NodeData[]): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline");

      const contextList = contextNodes.slice(0, 20).map(n => n.title).join(', ');

      const prompt = `
        I am materializing a "Ghost Node" in my knowledge graph titled: "${ghostTitle}".
        
        The surrounding context of the graph includes: ${contextList}.

        Generate the full content for this new node.
        1. Write a markdown body explaining the concept.
        2. Assign a category.
        3. Assign relevant tags (reuse existing tags if relevant).
        4. Provide a citation if possible (e.g. general theory reference).
      `;

      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['concept', 'person', 'project', 'feature', 'archive', 'contradiction', 'hypothesis'] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              citation: { type: Type.STRING, description: "Short ref, e.g. 'Standard Model'" }
          },
          required: ['title', 'content', 'category', 'tags']
      };

      try {
          const response = await this.ai.models.generateContent({
              model: this.modelPro,
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });
          
          const text = response.text;
          if (!text) throw new Error("Materialization Failed");
          return JSON.parse(text);
      } catch (error) {
          console.error("Materialization Error:", error);
          throw error;
      }
  }
}

export const geminiService = new GeminiService();