// File: api/ask.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { question } = body;
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Missing or invalid "question"' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = `You are AndrewGPT — a witty, practical know-it-all friend.
Answer clearly and concisely (1–3 short paragraphs). If helpful, add a tiny bullet list of steps. Keep it friendly.`;

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: system },
          { role: 'user', content: question }
        ]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenAI API error:', errText);
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const data = await resp.json();

    // Robust extraction across possible shapes
    let answer = '';
    if (typeof data.output_text === 'string' && data.output_text.trim()) {
      answer = data.output_text;
    } else if (Array.isArray(data.output)) {
      const parts = [];
      for (const item of data.output) {
        if (item?.content) {
          if (Array.isArray(item.content)) {
            for (const c of item.content) if (typeof c?.text === 'string') parts.push(c.text);
          } else if (typeof item.content === 'string') {
            parts.push(item.content);
          }
        }
      }
      answer = parts.join('\n').trim();
    } else if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      answer = data.choices[0].message.content;
    }

    if (!answer) {
      console.warn('Empty answer parsed from OpenAI:', JSON.stringify(data).slice(0, 500));
      return res.status(200).json({ answer: 'Hmm, I came up empty. Try rephrasing that?' });
    }

    return res.status(200).json({ answer });
  } catch (e) {
    console.error('ask.js exception:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}