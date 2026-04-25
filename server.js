require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/api/explain', async (req, res) => {
  try {
    const { spd, dir, tprDiff, pValue, group0, group1, prob0, prob1 } = req.body;
    const prompt = `Explain fairness metrics: SPD=${spd}, DIR=${dir}, TPR diff=${tprDiff}, p-value=${pValue}. Group ${group0}: ${(prob0*100).toFixed(1)}%, ${group1}: ${(prob1*100).toFixed(1)}%. Give summary and 2 mitigation steps. Keep under 200 words.`;
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    res.status(500).json({ reply: 'Gemini error. Check API key.' });
  }
});

app.post('/api/followup', async (req, res) => {
  try {
    const { question } = req.body;
    const result = await model.generateContent(question);
    res.json({ reply: result.response.text() });
  } catch (err) {
    res.status(500).json({ reply: 'Follow‑up failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on ${PORT}`));
