'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { APP_URL, assetForURL, assertTrustedSender } = require('../src/main/security.cjs');
const { registerIPC } = require('../src/main/ipc.cjs');

test('protocol serves only the bundled renderer assets', () => {
  assert.equal(assetForURL(APP_URL), 'index.html');
  assert.equal(assetForURL('mattoz://app/styles.css'), 'styles.css');
  assert.equal(assetForURL('mattoz://app/app.js'), 'app.js');
  for (const url of ['https://app/index.html', 'file:///etc/passwd', 'mattoz://other/index.html', 'mattoz://app/../main/main.cjs', 'mattoz://app/%2e%2e/main/main.cjs', 'mattoz://app/%2fetc/passwd', 'mattoz://app/index.html?path=secrets', 'mattoz://user@app/index.html', 'invalid']) {
    assert.equal(assetForURL(url), null, url);
  }
});

function fixture() {
  const frame = { url: APP_URL };
  const contents = { mainFrame: frame };
  const window = { isDestroyed: () => false, webContents: contents };
  return { window, event: { sender: contents, senderFrame: frame } };
}

test('IPC trusts only the current main window and its top-level local frame', () => {
  const { window, event } = fixture();
  assert.doesNotThrow(() => assertTrustedSender(event, window));
  assert.throws(() => assertTrustedSender(event, null));
  assert.throws(() => assertTrustedSender({ ...event, sender: {} }, window));
  assert.throws(() => assertTrustedSender({ ...event, senderFrame: { url: APP_URL } }, window));
  window.webContents.mainFrame.url = 'https://example.com';
  assert.throws(() => assertTrustedSender(event, window));
  window.isDestroyed = () => true;
  assert.throws(() => assertTrustedSender(event, window));
});

test('app info IPC returns metadata, rejects unexpected arguments and foreign senders', () => {
  const handlers = new Map();
  const { window, event } = fixture();
  registerIPC({ ipcMain: { handle: (name, callback) => handlers.set(name, callback) }, app: { getVersion: () => '0.1.0' }, getWindow: () => window });
  assert.deepEqual([...handlers.keys()], ['lyrics:get', 'window:fullscreen', 'app:get-info']);
  const invoke = handlers.get('app:get-info');
  assert.equal(invoke(event).version, '0.1.0');
  assert.equal(invoke(event).phase, 9);
  assert.throws(() => invoke(event, { path: 'C:\\private' }));
  assert.throws(() => invoke({ sender: {}, senderFrame: {} }));
});

test('fullscreen IPC only accepts booleans from the trusted main frame',()=>{const {window,event}=fixture();const handlers=new Map();let fullscreen=false;window.setFullScreen=value=>{fullscreen=value;};registerIPC({ipcMain:{handle:(k,f)=>handlers.set(k,f)},app:{getVersion:()=> '0.6.1'},getWindow:()=>window});const invoke=handlers.get('window:fullscreen');assert.equal(invoke(event,true),true);assert.equal(fullscreen,true);invoke(event,false);assert.equal(fullscreen,false);assert.throws(()=>invoke(event,'true'));assert.throws(()=>invoke({sender:{},senderFrame:{}},true));});
