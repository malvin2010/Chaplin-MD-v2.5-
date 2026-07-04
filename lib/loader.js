const fs = require('fs');
const path = require('path');

function loadCommands() {
  const dir = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

  const registry = new Map(); // command name/alias -> command object
  const categories = new Map(); // category name -> array of commands

  for (const file of files) {
    const mod = require(path.join(dir, file));
    const list = Array.isArray(mod) ? mod : (mod.commands || []);
    for (const cmd of list) {
      if (!cmd.name || typeof cmd.execute !== 'function') continue;
      const names = [cmd.name, ...(cmd.aliases || [])];
      for (const n of names) registry.set(n.toLowerCase(), cmd);

      const cat = cmd.category || 'Misc';
      if (!categories.has(cat)) categories.set(cat, []);
      // avoid duplicate listing if this exact command object already added (aliases share same object)
      if (!categories.get(cat).includes(cmd)) categories.get(cat).push(cmd);
    }
  }

  return { registry, categories };
}

module.exports = { loadCommands };
