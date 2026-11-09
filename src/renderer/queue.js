/* Shared by the renderer and Node tests. No Electron or DOM dependency. */
(function (root) {
  'use strict';
  class PlaybackQueue {
    constructor(random = Math.random) { this.tracks = []; this.index = -1; this.shuffle = false; this.repeat = 'off'; this.history = []; this.bag = []; this.random = random; }
    get current() { return this.tracks[this.index] || null; }
    add(tracks) { for (const track of tracks) if (!this.tracks.some(t => t.id === track.id)) this.tracks.push(track); this.bag = []; }
    select(index) { if (!Number.isInteger(index) || !this.tracks[index]) return false; if (this.index >= 0 && this.index !== index) this.history.push(this.index); this.index = index; this.bag = this.bag.filter(i => i !== index); return true; }
    next(ended = false) {
      if (!this.tracks.length) return false;
      if (this.index < 0) return this.select(0);
      if (ended && this.repeat === 'one') return true;
      if (this.shuffle) {
        if (!this.bag.length) {
          const used = new Set([...this.history, this.index]);
          this.bag = this.tracks.map((_, i) => i).filter(i => !used.has(i));
          if (!this.bag.length) {
            if (this.repeat !== 'all') return false;
            this.history = [];
            this.bag = this.tracks.map((_, i) => i).filter(i => i !== this.index);
            if (!this.bag.length) return true;
          }
        }
        const slot = Math.floor(this.random() * this.bag.length);
        return this.select(this.bag.splice(slot, 1)[0]);
      }
      if (this.index + 1 < this.tracks.length) return this.select(this.index + 1);
      return this.repeat === 'all' ? this.select(0) : false;
    }
    previous() {
      if (this.shuffle) { const i = this.history.pop(); if (i === undefined) return false; this.bag.push(this.index); this.index = i; return true; }
      return this.index > 0 ? this.select(this.index - 1) : this.repeat === 'all' && this.tracks.length > 0 ? this.select(this.tracks.length - 1) : false;
    }
    toggleShuffle() { this.shuffle = !this.shuffle; this.history = []; this.bag = []; return this.shuffle; }
  }
  if (typeof module === 'object' && module.exports) module.exports = { PlaybackQueue };
  else root.PlaybackQueue = PlaybackQueue;
})(globalThis);
