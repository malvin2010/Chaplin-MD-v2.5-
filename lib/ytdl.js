const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs = require('fs');
const path = require('path');

const DL_DIR = path.join(__dirname, '..', 'downloads');
if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR, { recursive: true });

// Prefer our own downloaded binary (installed by scripts/install-ytdlp.js, no
// Python required). Fall back to a system-installed `yt-dlp` on PATH if present
// (e.g. if the host already provides one), so this works either way.
const BUNDLED_BIN = path.join(__dirname, '..', 'bin', 'yt-dlp');
const YTDLP_BIN = fs.existsSync(BUNDLED_BIN) ? BUNDLED_BIN : 'yt-dlp';

async function runYtDlp(args) {
  try {
    const { stdout } = await execFileAsync(YTDLP_BIN, args, { maxBuffer: 1024 * 1024 * 50 });
    return stdout;
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('yt-dlp is not installed. Check the deploy logs for the postinstall step, or install it manually on the host.');
    }
    throw e;
  }
}

// Look up a song/video without downloading it — used to show the info card first.
async function search(query) {
  const stdout = await runYtDlp(['--dump-single-json', '--no-playlist', '--no-warnings', `ytsearch:${query}`]);
  const info = JSON.parse(stdout.trim().split('\n')[0]);
  return {
    title: info.title,
    url: info.webpage_url,
    thumbnail: info.thumbnail,
    duration: info.duration,
    views: info.view_count,
    uploader: info.uploader,
    id: info.id
  };
}

// Download audio only, returns local file path.
async function downloadAudio(url) {
  const id = `${Date.now()}`;
  const output = path.join(DL_DIR, `${id}.%(ext)s`);
  await runYtDlp(['-x', '--audio-format', 'mp3', '-o', output, '--no-playlist', '--no-warnings', url]);
  const file = path.join(DL_DIR, `${id}.mp3`);
  if (!fs.existsSync(file)) throw new Error('Audio download failed.');
  return file;
}

// Download video (mp4, capped at reasonable quality to keep file size sane).
async function downloadVideo(url) {
  const id = `${Date.now()}`;
  const output = path.join(DL_DIR, `${id}.%(ext)s`);
  await runYtDlp(['-f', 'mp4[height<=480]/mp4', '-o', output, '--no-playlist', '--no-warnings', url]);
  const file = path.join(DL_DIR, `${id}.mp4`);
  if (!fs.existsSync(file)) throw new Error('Video download failed.');
  return file;
}

function fmtDuration(sec) {
  if (!sec && sec !== 0) return 'Unknown';
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function fmtViews(n) {
  if (!n && n !== 0) return 'Unknown';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

module.exports = { search, downloadAudio, downloadVideo, fmtDuration, fmtViews, DL_DIR };
