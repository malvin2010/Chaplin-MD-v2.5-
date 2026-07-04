// Downloads the standalone yt-dlp binary straight from GitHub releases.
// This binary is self-contained (PyInstaller-built) and does NOT need Python
// on the host to run — unlike the yt-dlp-exec npm package, whose own installer
// insists on checking for a `python` binary before it'll even finish installing,
// which breaks on hosts (like some container panels) that don't have Python.
// If this download fails (e.g. no internet during build, or a firewall), it
// fails quietly with a warning instead of blocking the rest of npm install —
// so at worst you lose download commands, not the whole bot.

const https = require('https');
const fs = require('fs');
const path = require('path');

const BIN_DIR = path.join(__dirname, '..', 'bin');
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp');
const URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

function download(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
        res.resume();
        return resolve(download(res.headers.location, dest, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  try {
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });
    if (fs.existsSync(BIN_PATH)) {
      console.log('[Chaplin MD] yt-dlp binary already present, skipping download.');
      return;
    }
    console.log('[Chaplin MD] Downloading yt-dlp binary (no Python required)...');
    await download(URL, BIN_PATH);
    fs.chmodSync(BIN_PATH, 0o755);
    console.log('[Chaplin MD] yt-dlp binary installed successfully.');
  } catch (e) {
    console.warn('[Chaplin MD] Could not download yt-dlp binary automatically:', e.message);
    console.warn('[Chaplin MD] Download commands (.song, .video, .ytsearch) will not work until this is resolved.');
    console.warn('[Chaplin MD] The rest of the bot is unaffected — continuing install.');
  }
}

main();
