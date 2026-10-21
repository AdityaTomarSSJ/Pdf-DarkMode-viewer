// PDF Dark Mode Pro - Popup Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const toggleEnabled = document.getElementById('toggle-enabled');
  const masterIcon = document.getElementById('master-icon');
  const masterDesc = document.getElementById('master-desc');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');

  const fileAccessBanner = document.getElementById('file-access-banner');
  const btnOpenFileAccess = document.getElementById('btn-open-file-access');

  const presetsGrid = document.getElementById('presets-grid');
  const activeThemeName = document.getElementById('active-theme-name');

  const toggleSlidersBtn = document.getElementById('toggle-sliders-btn');
  const accordionArrow = document.getElementById('accordion-arrow');
  const slidersPanel = document.getElementById('sliders-panel');

  const rangeBrightness = document.getElementById('range-brightness');
  const valBrightness = document.getElementById('val-brightness');

  const rangeContrast = document.getElementById('range-contrast');
  const valContrast = document.getElementById('val-contrast');

  const rangeWarmth = document.getElementById('range-warmth');
  const valWarmth = document.getElementById('val-warmth');

  const rangeInvert = document.getElementById('range-invert');
  const valInvert = document.getElementById('val-invert');

  const toggleAutoEnable = document.getElementById('toggle-auto-enable');
  const toggleFloatingBtn = document.getElementById('toggle-floating-btn');

  const btnEditShortcut = document.getElementById('btn-edit-shortcut');
  const btnReset = document.getElementById('btn-reset');

  const THEME_NAMES = {
    charcoal: 'Charcoal Night',
    amoled: 'Pitch Black',
    sepia: 'Warm Sepia',
    midnight: 'Midnight Slate',
    nordic: 'Nordic Frost',
    matrix: 'Cyber Matrix',
    custom: 'Custom Theme'
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoEnable: true,
    theme: 'charcoal',
    brightness: 95,
    contrast: 95,
    warmth: 0,
    sepia: 0,
    invertLevel: 92,
    showFloatingButton: true
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  let activeTabId = null;

  // SVG Icons
  const ICONS = {
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
  };

  // Helper to save settings and notify active tab
  async function saveSettings(partial) {
    currentSettings = { ...currentSettings, ...partial };
    try {
      await chrome.storage.sync.set(partial);
    } catch (e) {
      await chrome.storage.local.set(partial);
    }

    if (activeTabId) {
      try {
        await chrome.tabs.sendMessage(activeTabId, {
          action: 'APPLY_SETTINGS',
          settings: currentSettings
        });
      } catch (err) {
        // Tab might be restricted or unloaded
      }
    }
  }

  // Update UI components
  function updateUI() {
    // Master Toggle
    toggleEnabled.checked = currentSettings.enabled;
    if (currentSettings.enabled) {
      masterIcon.innerHTML = ICONS.moon;
      masterDesc.textContent = 'Now You Dont have to burn Your Eyeballs';
      statusBadge.className = 'badge badge-active';
      statusText.textContent = 'Active';
    } else {
      masterIcon.innerHTML = ICONS.sun;
      masterDesc.textContent = 'Boring Mode';
      statusBadge.className = 'badge badge-inactive';
      statusText.textContent = 'Disabled';
    }

    // Presets
    const theme = currentSettings.theme || 'charcoal';
    activeThemeName.textContent = THEME_NAMES[theme] || 'Custom';

    document.querySelectorAll('.preset-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Sliders
    rangeBrightness.value = currentSettings.brightness;
    valBrightness.textContent = `${currentSettings.brightness}%`;

    rangeContrast.value = currentSettings.contrast;
    valContrast.textContent = `${currentSettings.contrast}%`;

    rangeWarmth.value = currentSettings.warmth;
    valWarmth.textContent = `${currentSettings.warmth}%`;

    rangeInvert.value = currentSettings.invertLevel;
    valInvert.textContent = `${currentSettings.invertLevel}%`;

    // General options
    toggleAutoEnable.checked = currentSettings.autoEnable;
    toggleFloatingBtn.checked = currentSettings.showFloatingButton;
  }

  // Check active tab status
  async function initTabContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      activeTabId = tab.id;

      // Check if file URL
      if (tab.url && tab.url.startsWith('file:///')) {
        chrome.runtime.sendMessage({ action: 'CHECK_FILE_ACCESS' }, (res) => {
          if (res && res.isAllowed === false) {
            fileAccessBanner.classList.remove('hidden');
          }
        });
      }

      // Query content script
      chrome.tabs.sendMessage(tab.id, { action: 'GET_STATUS' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Content script not ready or page is restricted
          return;
        }
        if (res.settings) {
          currentSettings = { ...currentSettings, ...res.settings };
          updateUI();
        }
      });
    } catch (e) {
      console.warn('Tab context query error:', e);
    }
  }

  // Load stored settings
  async function loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(null);
      currentSettings = { ...DEFAULT_SETTINGS, ...stored };
    } catch (e) {
      const stored = await chrome.storage.local.get(null);
      currentSettings = { ...DEFAULT_SETTINGS, ...stored };
    }
    updateUI();
  }

  // Event Listeners

  // Master switch
  toggleEnabled.addEventListener('change', () => {
    saveSettings({ enabled: toggleEnabled.checked });
    updateUI();
  });

  // Presets
  presetsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const theme = btn.dataset.theme;

    const updates = { theme };

    
    if (theme === 'charcoal') {
      updates.brightness = 95;
      updates.contrast = 95;
      updates.warmth = 0;
      updates.invertLevel = 92;
    } else if (theme === 'amoled') {
      updates.brightness = 100;
      updates.contrast = 105;
      updates.warmth = 0;
      updates.invertLevel = 100;
    } else if (theme === 'sepia') {
      updates.brightness = 92;
      updates.contrast = 92;
      updates.warmth = 35;
      updates.invertLevel = 88;
    } else if (theme === 'midnight') {
      updates.brightness = 96;
      updates.contrast = 98;
      updates.warmth = 0;
      updates.invertLevel = 92;
    } else if (theme === 'nordic') {
      updates.brightness = 95;
      updates.contrast = 95;
      updates.warmth = 0;
      updates.invertLevel = 90;
    } else if (theme === 'matrix') {
      updates.brightness = 98;
      updates.contrast = 110;
      updates.warmth = 0;
      updates.invertLevel = 100;
    }

    saveSettings(updates);
    updateUI();
  });

  // Sliders toggle
  toggleSlidersBtn.addEventListener('click', () => {
    slidersPanel.classList.toggle('collapsed');
    accordionArrow.classList.toggle('rotated');
  });

  // Sliders input
  rangeBrightness.addEventListener('input', () => {
    valBrightness.textContent = `${rangeBrightness.value}%`;
    saveSettings({ brightness: parseInt(rangeBrightness.value, 10) });
  });

  rangeContrast.addEventListener('input', () => {
    valContrast.textContent = `${rangeContrast.value}%`;
    saveSettings({ contrast: parseInt(rangeContrast.value, 10) });
  });

  rangeWarmth.addEventListener('input', () => {
    valWarmth.textContent = `${rangeWarmth.value}%`;
    saveSettings({ warmth: parseInt(rangeWarmth.value, 10) });
  });

  rangeInvert.addEventListener('input', () => {
    valInvert.textContent = `${rangeInvert.value}%`;
    saveSettings({ invertLevel: parseInt(rangeInvert.value, 10), theme: 'custom' });
    updateUI();
  });

  // General options
  toggleAutoEnable.addEventListener('change', () => {
    saveSettings({ autoEnable: toggleAutoEnable.checked });
  });

  toggleFloatingBtn.addEventListener('change', () => {
    saveSettings({ showFloatingButton: toggleFloatingBtn.checked });
  });

  // Buttons
  btnOpenFileAccess.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_EXTENSION_SETTINGS' });
  });

  btnEditShortcut.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_SHORTCUTS_PAGE' });
  });

  btnReset.addEventListener('click', async () => {
    if (confirm('Reset all settings to default?')) {
      currentSettings = { ...DEFAULT_SETTINGS };
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      updateUI();
    }
  });

  // Initialize
  await loadSettings();
  await initTabContext();
});
