const express = require('express');
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const conversations  = {}; // stores chat history per user

const SYSTEM = `Du bist die freundliche Onboarding-Assistenz der Universität für Nachhaltigkeit...`; // your FAQ here

app.post('/telegram', async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId  = msg.chat.id;
  const text    = msg.text;

  // build conversation history per user
  if (!conversations[chatId]) conversations[chatId] = [];
  conversations[chatId].push({ role: 'user', content: text });

  // call Claude
  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM,
      messages: conversations[chatId]
    })
  });

  const data  = await aiRes.json();
  const reply = data.content?.[0]?.text || 'Es ist ein Fehler aufgetreten.';

  conversations[chatId].push({ role: 'assistant', content: reply });

  // send reply back to Telegram
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: reply })
  });

  res.sendStatus(200);
});

app.listen(3000);
```

---

**Step 3 — Add the token to Render (1 min)**

In your Render dashboard → Environment Variables → add:
- `TELEGRAM_TOKEN` = your BotFather token

---

**Step 4 — Connect Telegram to your backend (2 min)**

Run this URL once in your browser — just replace the two values:
```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_RENDER_URL>/telegram
