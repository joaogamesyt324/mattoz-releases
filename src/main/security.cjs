'use strict';

const APP_URL = 'mattoz://app/index.html';
// Explicit asset mapping: no arbitrary filesystem paths cross the protocol.
const ASSETS = Object.freeze({
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/app.js': 'app.js',
  '/sleep-timer.js': 'sleep-timer.js',
  '/phase7.js': 'phase7.js',
  '/studio.js': 'studio.js',
  '/singles.js': 'singles.js',
  '/global-search.js': 'global-search.js',
  '/vinyl-control.js': 'vinyl-control.js',
  '/queue.js': 'queue.js',
  '/buffer-deck.js': 'buffer-deck.js',
  '/audio-transport.js': 'audio-transport.js',
  '/personal-collection.js': 'personal-collection.js',
  '/player.js': 'player.js',
  '/lrc.js': 'lrc.js',
  '/lyrics.js': 'lyrics.js',
  '/library-ui.js': 'library-ui.js',
  '/equalizer.js': 'equalizer.js',
  '/desktop-ui.js': 'desktop-ui.js',
  '/animated-cover.js': 'animated-cover.js',
  '/launcher.js': 'launcher.js',
  '/track-fade.js': 'track-fade.js',
  '/album-ui.js': 'album-ui.js',
  '/import-ui.js': 'import-ui.js',
  '/display-options.js': 'display-options.js',
  '/immersive-custom.js': 'immersive-custom.js',
  '/share-card.js': 'share-card.js',
  '/saved-ui.js': 'saved-ui.js',
  '/settings.js': 'settings.js',
  '/now-playing.js': 'now-playing.js',
  '/music-ui.js': 'music-ui.js',
  '/home.js': 'home.js',
  '/listening.js': 'listening.js'
});

function assetForURL(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'mattoz:' || url.host !== 'app' || url.username || url.password || url.search || url.hash) return null;
    return Object.hasOwn(ASSETS, url.pathname) ? ASSETS[url.pathname] : null;
  } catch { return null; }
}

function assertTrustedSender(event, window) {
  if (!window || window.isDestroyed() || event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== APP_URL) {
    throw new Error('Origem IPC não autorizada.');
  }
}

module.exports = { APP_URL, assetForURL, assertTrustedSender };
