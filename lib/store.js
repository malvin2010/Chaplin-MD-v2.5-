const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function file(name) {
  return path.join(DATA_DIR, name);
}

function load(name, fallback) {
  const f = file(name);
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fallback;
  }
}

function save(name, data) {
  fs.writeFileSync(file(name), JSON.stringify(data, null, 2));
}

// ---- Premium users ----
function getPremium() {
  return load('premium.json', []);
}
function addPremium(jid) {
  const list = getPremium();
  if (!list.includes(jid)) list.push(jid);
  save('premium.json', list);
  return list;
}
function delPremium(jid) {
  let list = getPremium();
  list = list.filter(j => j !== jid);
  save('premium.json', list);
  return list;
}
function isPremium(jid) {
  return getPremium().includes(jid);
}

// ---- Playlist (per chat) ----
function getPlaylist(chatId) {
  const all = load('playlists.json', {});
  return all[chatId] || [];
}
function addToPlaylist(chatId, track) {
  const all = load('playlists.json', {});
  if (!all[chatId]) all[chatId] = [];
  all[chatId].push(track);
  save('playlists.json', all);
  return all[chatId];
}

// ---- Chatbot toggle (per chat) ----
function getChatbotState() {
  return load('chatbot.json', {});
}
function setChatbot(chatId, on) {
  const all = getChatbotState();
  all[chatId] = on;
  save('chatbot.json', all);
}
function isChatbotOn(chatId) {
  const all = getChatbotState();
  return !!all[chatId];
}

module.exports = {
  getPremium, addPremium, delPremium, isPremium,
  getPlaylist, addToPlaylist,
  getChatbotState, setChatbot, isChatbotOn
};
