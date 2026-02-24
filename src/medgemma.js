import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Allow requests from React dev server
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ResourceRX Backend is running ✅");
});

app.post("/api/medgemma", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await response.json();
    res.json({ response: data.response });

  } catch (error) {
    console.error("Local MedGemma error:", error);
    res.status(500).json({ error: "Local model failed" });
  }
});

// Quick test endpoint
app.get("/test-ai", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: "Explain symptoms of malaria in simple terms",
        stream: false,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});