// Tracks short-lived "waiting for a reply" state, e.g. after showing song info,
// waiting for the user to reply 1 (audio) or 2 (document).
// Keyed by chatId so it works in groups and DMs. Auto-expires after 2 minutes.

const pending = new Map();

function set(chatId, data, ttlMs = 120000) {
  const timeout = setTimeout(() => pending.delete(chatId), ttlMs);
  pending.set(chatId, { ...data, timeout });
}

function get(chatId) {
  return pending.get(chatId);
}

function clear(chatId) {
  const entry = pending.get(chatId);
  if (entry?.timeout) clearTimeout(entry.timeout);
  pending.delete(chatId);
}

module.exports = { set, get, clear };
