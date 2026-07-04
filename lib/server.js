const express = require('express');
const path = require('path');
const axios = require('axios');
const config = require('../config');

function startServer(getPairingCodeFn) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Health check / keep-alive ping target
  app.get('/ping', (req, res) => {
    res.json({ status: 'alive', bot: config.BOT_NAME, time: new Date().toISOString() });
  });

  // Pairing endpoint used by public/index.html.
  // Generates a WhatsApp pairing code for the phone number the visitor enters.
  app.post('/api/pair', async (req, res) => {
    try {
      const { number } = req.body;
      if (!number || !/^\d{8,15}$/.test(number)) {
        return res.status(400).json({ error: 'Enter a valid phone number with country code, digits only (no +).' });
      }
      const code = await getPairingCodeFn(number);
      res.json({ code });
    } catch (e) {
      console.error('Pairing error:', e);
      res.status(500).json({ error: e.message || 'Pairing failed. Try again in a minute.' });
    }
  });

  app.listen(config.PORT, () => {
    console.log(`🌐 ${config.BOT_NAME} website + keep-alive server running on port ${config.PORT}`);
  });

  // Self-ping so Render's free tier sees regular traffic.
  // NOTE: this alone cannot wake an already-sleeping free instance — you still
  // need an external pinger like UptimeRobot hitting SELF_URL/ping every 5 min.
  // See README for the 2-minute setup.
  if (config.SELF_URL) {
    setInterval(() => {
      axios.get(`${config.SELF_URL}/ping`).catch(() => {});
    }, 4 * 60 * 1000);
  }

  return app;
}

module.exports = { startServer };
