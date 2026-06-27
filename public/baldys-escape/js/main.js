// ════════════════════════════════════════════════════════
// Main — entry point
// ════════════════════════════════════════════════════════

let renderer, engine, save, ui;

function init() {
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());

  engine = new Engine(renderer);
  engine.bindCanvasPointer(canvas);

  save = new SaveData();
  SFX.enabled = save.data.soundOn !== false;

  ui = new UI(engine, renderer, save);
  document.getElementById('btn-sound').textContent = SFX.enabled ? '🔊' : '🔇';

  // First user interaction unlocks audio context (browser requirement)
  const unlock = () => { SFX.ensure(); window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock);

  ui.showMenu();

  // HUD tick loop (lightweight, separate from render loop)
  setInterval(() => ui.tickHUD(), 100);

  // Escape key = pause
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && engine.state === ENGSTATE.PLAYING) ui.openPause();
  });
}

document.addEventListener('DOMContentLoaded', init);

// ════════════════════════════════════════════════════════
// PWA — service worker registration + install prompt
// ════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('btn-install');
  if (btn) btn.classList.remove('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('btn-install');
  if (!installBtn) return;
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.add('hidden');
  });
});

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('btn-install');
  if (btn) btn.classList.add('hidden');
  deferredInstallPrompt = null;
});
