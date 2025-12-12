# Encephra

**Encephra:** The 3D Cognitive Space Connecting Human Thought and AI Reasoning

![Encephra Preview](https://via.placeholder.com/800x400?text=Encephra+3D+Interface)

## 🧠 Core Philosophy
Encephra is **Local-First software**.
*   **Privacy:** All graph data is stored in your browser's `localStorage`. No data is sent to a cloud database.
*   **AI on Demand:** Data is only sent to Google Gemini when you explicitly trigger a "Cortex" function (e.g., Synthesis, Gap Analysis).

## 🚀 Features

### 🌌 Spatial Engine
*   **Physics Simulation:** Nodes repel each other, connections act as springs, and similar tags create gravitational clusters.
*   **3D Navigation:** Full orbit controls (Rotate, Pan, Zoom).
*   **Markdown Editor:** Rich text editing for every node, supporting images and code blocks.

### ⚡ Cortex Intelligence (AI Modes)
*Requires a Google Gemini API Key.*

1.  **Interneuron (Bridge):** Select two nodes, and the AI will synthesize a "Bridge Concept" explaining the logical link between them.
2.  **Entropy (Collision):** Force a high-temperature collision between two unrelated concepts to generate abstract, speculative synthesis.
3.  **Inference (Gap Analysis):** The AI analyzes a cluster of nodes to find "Ghost Nodes"—concepts that *should* exist in your graph but are missing.
4.  **Engram (Memory):** Summarize and consolidate complex node clusters into concise "Traces" or deep "Consolidations".

### 📥 Data Protocols
*   **Protocol Occipital (Vision):** Drag & Drop images (diagrams, whiteboards). The AI deconstructs them into graph structures.
*   **Research Multiverse:** Drag & Drop multiple PDFs. The AI performs a comparative meta-analysis, identifying shared pathways and contradictions.
*   **Encoding:** Upload single PDFs to explode them into granular concept maps.

> **Note:** When using **Encode** or **Research** modes, it takes time to process the PDFs. Please be patient, things will work! (typical run time range between 40-90 seconds, depending on file size and complexity)

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation (or just use in google ai studio rightaway!)

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

### Usage
1.  **Add Node:** Click the `+` icon or press the button in the settings panel.
2.  **Connect:** Click the **Synapse (Network)** icon, click a Source Node, then click a Target Node.
3.  **AI Features:** Click the **Cortex (Brain)** icon to open the Enhanced Toolbar. Enter your API Key in the Settings panel (`Settings2` icon).

## 🎮 Controls

| Action | Input |
| :--- | :--- |
| **Rotate View** | Left Click + Drag |
| **Pan Camera** | Right Click + Drag |
| **Zoom** | Scroll Wheel |
| **Select Node** | Click Node |
| **Reset View** | Double Click Background |

If you want to reset the graph, press reset in our settings icon, and watch our negative entropy mode.

## 📦 Tech Stack
*   **Frontend:** React 19, TypeScript
*   **3D Engine:** Three.js, React Three Fiber (R3F)
*   **Post-Processing:** Bloom, Noise, Vignette (@react-three/postprocessing)
*   **AI:** Google GenAI SDK (`gemini-2.5-flash`, `gemini-3-pro`)
*   **Styling:** Tailwind CSS, Lucide React

## 📄 License
This project is submitted to the Google DeepMind Vibe Coding Competition and is licensed under CC BY 4.0 as per competition rules.
