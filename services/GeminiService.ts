import { GoogleGenAI, Type, Schema } from "@google/genai";

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

  async processDocument(
      fileBase64: string, 
      mimeType: string, 
      mode: 'flash' | 'focus' | 'insight'
  ): Promise<any> {
      if (!this.ai) throw new Error("Cortex Offline: API Key missing.");

      let promptText = "";
      let nodeCount = 10;

      switch(mode) {
          case 'flash':
              promptText = "Analyze this document. Extract only the 4–12 most essential high-level concepts. Create a minimal conceptual skeleton. Give me the big picture. Focus on brevity.";
              nodeCount = 12;
              break;
          case 'focus':
              promptText = "Analyze this document. Extract 15–35 moderately detailed concepts, including key subtopics and relationships. Preserve clarity over density. Identify the main components and their meaningful substructures.";
              nodeCount = 30;
              break;
          case 'insight':
              promptText = "Analyze this document deeply. Extract 35–55 detailed concepts with concise summaries. Include edge cases, nuanced subtopics, and inferred conceptual relationships. Map the full conceptual landscape.";
              nodeCount = 50;
              break;
      }

      const schema: Schema = {
          type: Type.OBJECT,
          properties: {
              rootTitle: { type: Type.STRING, description: "The main title/theme of the document" },
              rootSummary: { type: Type.STRING, description: "A markdown summary of the entire document" },
              nodes: {
                  type: Type.ARRAY,
                  description: `List of ${nodeCount} concept nodes extracted from the text`,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING, description: "Markdown content for this concept" },
                          category: { type: Type.STRING, enum: ['concept', 'person', 'project', 'feature', 'archive'] },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
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
          const response = await this.ai.models.generateContent({
              model: this.modelFlash,
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
}

export const geminiService = new GeminiService();