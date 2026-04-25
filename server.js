require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
}

// Use v1beta endpoint with a stable, widely available model
const MODEL_NAME = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

app.post('/api/explain', async (req, res) => {
    try {
        const { spd, dir, tprDiff, pValue, group0, group1, prob0, prob1 } = req.body;
        const prompt = `Explain fairness metrics: SPD=${spd}, DIR=${dir}, TPR diff=${tprDiff}, p-value=${pValue}. Group ${group0}: ${(prob0*100).toFixed(1)}%, ${group1}: ${(prob1*100).toFixed(1)}%. Give a short summary and 2 actionable steps to mitigate any bias. Keep under 200 words.`;
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Special handling for rate limits (429)
            if (response.status === 429) {
                return res.status(429).json({ reply: '⏳ Gemini API rate limit reached. Please wait a minute and try again.' });
            }
            throw new Error(data.error?.message || 'Gemini API error');
        }
        
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
        res.json({ reply });
    } catch (err) {
        console.error('Gemini error:', err);
        res.status(500).json({ reply: 'Gemini error: ' + err.message });
    }
});

app.post('/api/followup', async (req, res) => {
    try {
        const { question } = req.body;
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] })
        });
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 429) {
                return res.status(429).json({ reply: '⏳ Rate limit exceeded. Please wait a minute.' });
            }
            throw new Error(data.error?.message || 'Gemini API error');
        }
        
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
        res.json({ reply });
    } catch (err) {
        console.error('Follow-up error:', err);
        res.status(500).json({ reply: 'Follow-up failed: ' + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gemini proxy running on port ${PORT}`));
