// Shared "small caps" text stylizer — the classic WhatsApp fancy-font look.
// Used by the .smallcaps command AND wrapped around every outgoing message
// so the whole bot has a consistent visual style, as requested.

const SMALLCAPS_MAP = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

function mapChars(text, map) {
  return text.split('').map(c => {
    const lower = c.toLowerCase();
    return map[lower] || c;
  }).join('');
}

// Stylizes a block of text but leaves URLs, numbers, emoji, and punctuation untouched
// so links still work and emoji/formatting don't get mangled.
function stylize(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .split(/(\bhttps?:\/\/\S+\b)/g) // keep URLs untouched
    .map(part => (part.startsWith('http') ? part : mapChars(part, SMALLCAPS_MAP)))
    .join('');
}

// Applies stylize() to the visible text fields of a Baileys message content object,
// without touching functional fields like buttonId (which must stay an exact match
// for the command parser) or media URLs.
function styleContent(content) {
  if (!content || typeof content !== 'object') return content;
  const styled = { ...content };
  if (typeof styled.text === 'string') styled.text = stylize(styled.text);
  if (typeof styled.caption === 'string') styled.caption = stylize(styled.caption);
  if (typeof styled.footer === 'string') styled.footer = stylize(styled.footer);
  if (Array.isArray(styled.buttons)) {
    styled.buttons = styled.buttons.map(b => ({
      ...b,
      buttonText: b.buttonText ? { displayText: stylize(b.buttonText.displayText) } : b.buttonText
    }));
  }
  return styled;
}

module.exports = { stylize, styleContent, SMALLCAPS_MAP, mapChars };
