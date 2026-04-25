require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Update 1: Change the API endpoint to 'v1' instead of 'v1beta'
// Update 2: Change the model name to the supported 'gemini-2.0-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

app.post('/api/explain', async (req, res) => {
    try {
        const { spd, dir, tprDiff, pValue, group0, group1, prob0, prob1 } = req.body;
        const prompt = `Explain fairness metrics: SPD=${spd}, DIR=${dir}, TPR diff=${tprDiff}, p-value=${pValue}. Group ${group0}: ${(prob0*100).toFixed(1)}%, ${group1}: ${(prob1*100).toFixed(1)}%. Give summary and 2 mitigation steps. Keep under 200 words.`;
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
        res.json({ reply: data.candidates[0].content.parts[0].text });
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
        if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
        res.json({ reply: data.candidates[0].content.parts[0].text });
    } catch (err) {
        console.error('Follow-up error:', err);
        res.status(500).json({ reply: 'Follow-up failed: ' + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on ${PORT}`));
