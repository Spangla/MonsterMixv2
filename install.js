/* The browser owns installation. This guide never blocks Android's default prompt. */
(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const HIDE_KEY = 'MonsterMixv2:hide-install-guide';
  const SEEN_KEY = 'MonsterMixv2:install-guide-seen';
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Version\/.*Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram/.test(ua);
  const standalone = window.matchMedia('(display-mode: standalone)');
  const fullscreen = window.matchMedia('(display-mode: fullscreen)');
  const minimalUI = window.matchMedia('(display-mode: minimal-ui)');
  const dialog = byId('install-dialog');
  let nativePrompt = null;
  let installedHere = false;
  let dialogDismissed = false;
  function readStorage(storage, key) {
    try { return window[storage].getItem(key) === '1'; } catch { return false; }
  }
  function writeStorage(storage, key, value = true) {
    try {
      if (value) window[storage].setItem(key, '1');
      else window[storage].removeItem(key);
    } catch { /* Calculator still works with storage blocked. */ }
  }
  function isInstalledView() {
    return installedHere || navigator.standalone === true || standalone.matches || fullscreen.matches || minimalUI.matches;
  }
  function syncInstallUI() {
    const installed = isInstalledView();
    byId('install-options').hidden = installed || (!isIOS && !isAndroid && !nativePrompt);
    byId('install-native').hidden = installed || !nativePrompt;
    byId('install-iphone').hidden = installed || !isIOS;
    byId('install-menu-help').hidden = installed || !isAndroid || Boolean(nativePrompt);
    if (installed && dialog.open) dialog.close();
  }
  function showGuide() {
    if (isInstalledView()) return;
    dialogDismissed = false;
    byId('install-welcome').hidden = false;
    dialog.classList.remove('is-guiding');
    byId('install-steps').hidden = true;
    byId('install-title').innerHTML = 'Keep Monster Mix<br>on your phone';
    byId('install-remember').checked = readStorage('localStorage', HIDE_KEY);
    dialog.setAttribute('aria-describedby', 'install-description');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  function closeGuide() {
    dialogDismissed = true;
    writeStorage('sessionStorage', SEEN_KEY);
    writeStorage('localStorage', HIDE_KEY, byId('install-remember').checked);
    if (dialog.open) dialog.close();
  }
  function installed() {
    installedHere = true;
    nativePrompt = null;
    writeStorage('localStorage', HIDE_KEY);
    syncInstallUI();
  }
  window.addEventListener('beforeinstallprompt', event => {
    // Deliberately do not call preventDefault(): retain Android's install popup.
    if (isInstalledView()) return;
    nativePrompt = event;
    syncInstallUI();
    if (isAndroid) byId('install-options').open = true;
    // The browser's own prompt can consume this event before our button is tapped.
    if (event.userChoice) event.userChoice.then(choice => {
      if (choice.outcome === 'accepted') installed();
      else if (nativePrompt === event) { nativePrompt = null; syncInstallUI(); }
    }).catch(() => { if (nativePrompt === event) { nativePrompt = null; syncInstallUI(); } });
  });
  window.addEventListener('appinstalled', installed);
  byId('install-native').addEventListener('click', async () => {
    const prompt = nativePrompt;
    if (!prompt || isInstalledView()) return;
    nativePrompt = null;
    syncInstallUI();
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') installed();
      else byId('install-status').textContent = 'Installation cancelled. You can use the browser menu to install later.';
    } catch {
      byId('install-status').textContent = 'Use your browser’s menu to install or add this app to your Home Screen.';
    }
  });
  byId('install-iphone').addEventListener('click', showGuide);
  byId('install-start').addEventListener('click', () => {
    dialog.classList.add('is-guiding');
    byId('install-welcome').hidden = true;
    byId('install-steps').hidden = false;
    byId('install-title').textContent = 'Add Monster Mix to your iPhone';
    dialog.removeAttribute('aria-describedby');
    byId('install-safari-warning').hidden = isSafari;
    byId('install-title').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  });
  for (const id of ['install-close', 'install-later', 'install-done']) byId(id).addEventListener('click', closeGuide);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeGuide(); });
  dialog.addEventListener('close', () => {
    if (!dialogDismissed && !isInstalledView()) closeGuide();
  });
  for (const query of [standalone, fullscreen, minimalUI]) query.addEventListener('change', syncInstallUI);
  window.addEventListener('pageshow', syncInstallUI);
  syncInstallUI();
  if (isIOS && !isInstalledView() && !readStorage('localStorage', HIDE_KEY) && !readStorage('sessionStorage', SEEN_KEY)) showGuide();
})();
