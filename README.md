# Prerequisites
Requirement________Notes
# 
Node.js 18+________Required for Vite frontend and Express backend
# 
npm________________Comes with Node.js
# 
Ollama_____________Download from ollama.com~2 GB disk
# 
gemma:2b__________model is ~1.5 GB
# 
Git__________________For cloning and collaboration
# First-Time Installation
# 1. Install frontend dependencies (from project root)
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Install Ollama (macOS / Linux)
curl -fsSL https://ollama.com/install.sh | sh
# Windows: download installer from https://ollama.com

# 4. Pull the AI model (one-time, ~1.5 GB download)
ollama pull gemma:2b
Running (3 Terminals)
bash# Terminal 1 — AI engine
ollama serve

# Terminal 2 — Express AI proxy backend
cd resourcerx/server && node index.js

# Terminal 3 — React frontend
cd resourcerx && npm run dev

App: http://localhost:5173
AI backend: http://localhost:5000
Verify AI working: curl http://localhost:5000/test-ai
