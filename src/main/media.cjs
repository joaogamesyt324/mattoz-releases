'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Readable } = require('node:stream');

function parseRange(value, size) {
  if (!value) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!m || (!m[1] && !m[2])) throw new Error('range');
  let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) throw new Error('range');
  return { start, end };
}

class MediaRegistry {
  constructor() { this.files = new Map(); this.ids = new Map(); }
  async add(paths) {
    const tracks = []; let skipped = 0;
    for (const candidate of paths) {
      try {
        if (path.extname(candidate).toLowerCase() !== '.mp3') throw new Error('type');
        const real = await fs.realpath(candidate);
        if (!(await fs.stat(real)).isFile()) throw new Error('file');
        let id = this.ids.get(real);
        if (!id) { id = randomUUID(); this.ids.set(real, id); this.files.set(id, real); }
        tracks.push({ id, title: path.basename(candidate, path.extname(candidate)), url: `mattoz-media://audio/${id}` });
      } catch { skipped++; }
    }
    return { tracks, skipped };
  }
  async lyrics(id) {
    const file = this.files.get(id);
    if (!file) return { status: 'missing', text: '' };
    try {
      const dir = path.dirname(file);
      const target = (path.basename(file, path.extname(file)) + '.lrc').toLowerCase();
      const names = await fs.readdir(dir);
      const name = names.find(n => n.toLowerCase() === target);
      if (!name) return { status: 'missing', text: '' };
      const handle = await fs.open(path.join(dir, name), 'r');
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > 1024 * 1024) return { status: 'invalid', text: '' };
        const data = await handle.readFile();
        const text = data[0] === 255 && data[1] === 254 ? data.subarray(2).toString('utf16le') : new TextDecoder('utf-8', { fatal: true }).decode(data);
        return { status: 'ok', text };
      } finally { await handle.close(); }
    } catch { return { status: 'error', text: '' }; }
  }
  async respond(request) {
    let handle;
    try {
      const url = new URL(request.url);
      if (url.protocol !== 'mattoz-media:' || url.host !== 'audio' || url.search || url.hash || url.username || url.password || !['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404 });
      const filename = this.files.get(url.pathname.slice(1));
      if (!filename) return new Response(null, { status: 404 });
      handle = await fs.open(filename, 'r');
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size === 0) { await handle.close(); return new Response(null, { status: 404 }); }
      let range;
      try { range = parseRange(request.headers.get('range'), stat.size); }
      catch { await handle.close(); return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } }); }
      const start = range?.start ?? 0, end = range?.end ?? stat.size - 1;
      const headers = { 'Access-Control-Allow-Origin':'mattoz://app', 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1), 'Cache-Control': 'no-store' };
      if (range) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      if (request.method === 'HEAD') { await handle.close(); return new Response(null, { status: range ? 206 : 200, headers }); }
      const stream = handle.createReadStream({ start, end, autoClose: true });
      return new Response(Readable.toWeb(stream), { status: range ? 206 : 200, headers });
    } catch {
      if (handle) await handle.close().catch(() => {});
      return new Response(null, { status: 404 });
    }
  }
}
module.exports = { MediaRegistry, parseRange };
