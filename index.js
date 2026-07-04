const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const config = require('./config');
const store = require('./lib/store');
const pending = require('./lib/pending');
const { loadCommands } = require('./lib/loader');
const { startServer } = require('./lib/server');
const { generateReply } = require('./lib/aiReply');
const { styleContent } = require('./lib/style');
const ytdl = require('./lib/ytdl');
const fs = require('fs');

const { registry, categories } = loadCommands();
console.log(`✅ Loaded ${registry.size} command names across ${categories.size} categories.`);

const SESSION_DIR = path.join(__dirname, 'session');

let currentSock = null;
let isRegistered = false;

async function requestPairingCodeFor(number) {
  if (!currentSock) throw new Error('Bot is still starting up, try again in a few seconds.');
  if (isRegistered) throw new Error('This bot instance is already paired to a number. Restart with a fresh session to re-pair.');
  const code = await currentSock.requestPairingCode(number.trim());
  return code.match(/.{1,4}/g).join('-');
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['Chaplin MD', 'Chrome', '2.5.0']
  });

  currentSock = sock;
  isRegistered = !!sock.authState.creds.registered;

  // Apply the small-caps font style to every outgoing message, everywhere,
  // by wrapping sendMessage once here. Every command (all 280+ of them) calls
  // sock.sendMessage under the hood, so this single wrap covers all of them.
  const rawSend = sock.sendMessage.bind(sock);
  sock.sendMessage = (jid, content, options) => rawSend(jid, styleContent(content), options);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      isRegistered = true;
      console.log(`✅ ${config.BOT_NAME} connected to WhatsApp.`);
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('Connection closed, reconnecting...');
        startBot();
      } else {
        console.log('❌ Logged out. Delete the session folder and re-pair via the website.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const text = m.message.conversation
      || m.message.extendedTextMessage?.text
      || m.message.imageMessage?.caption
      || '';
    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;

    const isOwner = sender.replace(/\D/g, '').startsWith(config.OWNER_NUMBER) || sender === `${config.OWNER_NUMBER}@s.whatsapp.net`;

    // --- Handle pending "audio or document" choice for songs ---
    const pend = pending.get(from);
    if (pend && pend.type === 'song_choice' && /^[12]$/.test(text.trim())) {
      pending.clear(from);
      const wantsDoc = text.trim() === '2';
      try {
        const wait = await sock.sendMessage(from, { text: `⬇️ Downloading *${pend.title}*...` }, { quoted: m });
        const file = await ytdl.downloadAudio(pend.url);
        const sizeMB = fs.statSync(file).size / 1024 / 1024;
        if (sizeMB > config.MAX_AUDIO_MB) {
          fs.unlinkSync(file);
          return sock.sendMessage(from, { text: `❌ File too large to send (${sizeMB.toFixed(1)}MB).` }, { quoted: wait });
        }
        const buffer = fs.readFileSync(file);
        if (wantsDoc) {
          await sock.sendMessage(from, { document: buffer, mimetype: 'audio/mpeg', fileName: `${pend.title}.mp3` }, { quoted: wait });
        } else {
          await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: wait });
        }
        fs.unlinkSync(file);
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Download failed: ${e.message}` }, { quoted: m });
      }
      return;
    }

    // --- Handle the .guessnumber game's pending guesses ---
    if (pend && pend.type === 'guess_number' && /^\d+$/.test(text.trim())) {
      const guess = parseInt(text.trim());
      pend.tries += 1;
      if (guess === pend.target) {
        pending.clear(from);
        await sock.sendMessage(from, { text: `🎉 Correct! It was ${pend.target}. You got it in ${pend.tries} ${pend.tries === 1 ? 'try' : 'tries'}!` }, { quoted: m });
      } else if (pend.tries >= 8) {
        pending.clear(from);
        await sock.sendMessage(from, { text: `❌ Out of tries! The number was ${pend.target}.` }, { quoted: m });
      } else {
        await sock.sendMessage(from, { text: guess < pend.target ? '📈 Higher!' : '📉 Lower!' }, { quoted: m });
      }
      return;
    }

    // --- Command handling ---
    if (text.startsWith(config.PREFIX)) {
      const [cmdRaw, ...args] = text.slice(config.PREFIX.length).trim().split(/ +/);
      const cmd = registry.get((cmdRaw || '').toLowerCase());
      if (cmd) {
        try {
          await cmd.execute({
            sock, m, from, sender, isGroup, args, text, quotedMsg,
            isOwner, config, store, categories, registry
          });
        } catch (e) {
          console.error(`Error in command ${cmd.name}:`, e);
          await sock.sendMessage(from, { text: `❌ Something went wrong running that command.` }, { quoted: m });
        }
      }
      return;
    }

    // --- Chatbot auto-reply: replies when the bot is tagged/mentioned and chatbot is ON for this chat ---
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const botJid = sock.user?.id?.split(':')[0];
    const wasTagged = mentioned.some(j => j.startsWith(botJid)) || (quotedMsg && m.message.extendedTextMessage?.contextInfo?.participant?.startsWith(botJid));

    if (store.isChatbotOn(from) && wasTagged && text) {
      const reply = generateReply(text);
      await sock.sendMessage(from, { text: reply }, { quoted: m });
    }
  });
}

startBot().catch(err => console.error('Fatal error starting bot:', err));
startServer(requestPairingCodeFor);
