// File: api/ask.js (Vercel Serverless Function)
// Usage: Put this file at /api/ask.js in your Vercel project.
// Environment variable required: OPENAI_API_KEY
// Frontend should POST JSON: { "question": "your text" } to /api/ask

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { question } = body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "question"' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const system = `You are AndrewGPT — a witty, practical know-it-all friend.
Answer clearly and concisely in 1-3 paragraphs max.
If helpful, include a short bulleted list of steps. Keep a light, humorous tone.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: question }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(500).json({ error: "OpenAI API error", details });
    }

    const data = await response.json();
    // Responses API provides output_text for convenience
    const answer = data.output_text || "No answer.";
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
