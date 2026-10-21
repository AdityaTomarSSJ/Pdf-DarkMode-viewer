(() => {
  // Prevent running in subframes (crucial to avoid double-inversion on Chrome's PDF viewer)
  if (window !== window.top) return;

  // Prevent duplicate injection
  if (window.__PDF_DARK_MODE_INJECTED__) return;
  window.__PDF_DARK_MODE_INJECTED__ = true;

  // Preset Filters
  const PRESET_FILTERS = {
    charcoal: 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(0.95)',
    amoled: 'invert(1) hue-rotate(180deg) contrast(1.02)',
    sepia: 'invert(0.90) hue-rotate(180deg) sepia(0.35) brightness(0.92)',
    midnight: 'invert(0.92) hue-rotate(200deg) brightness(0.96)',
    nordic: 'invert(0.90) hue-rotate(165deg) brightness(0.95)',
    matrix: 'invert(1) sepia(100%) hue-rotate(85deg) saturate(320%)'
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
  let isPagePDF = false;
  let forceActive = false;

  // Detect if current page is viewing a PDF
  function detectPDF() {
    if (document.contentType === 'application/pdf') return true;

    const href = location.href.toLowerCase();
    const pathname = location.pathname.toLowerCase();
    if (pathname.endsWith('.pdf')) return true;
    if (href.includes('.pdf?') || href.includes('.pdf#')) return true;

    if (document.title && document.title.toLowerCase().endsWith('.pdf')) return true;

    if (document.querySelector('embed[type="application/pdf"]')) return true;
    if (document.querySelector('embed[name="plugin"][type="application/pdf"]')) return true;
    if (document.querySelector('object[type="application/pdf"]')) return true;

    if (document.getElementById('viewerContainer') || document.querySelector('.pdfViewer')) return true;
    if (window.PDFViewerApplication) return true;

    return false;
  }

  // Create or update Floating Toggle Button
  function updateFloatingButton(isEnabled) {
    if (!currentSettings.showFloatingButton || (!isPagePDF && !forceActive)) {
      removeFloatingButton();
      return;
    }

    let btn = document.getElementById('pdf-darkmode-floating-btn');
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'pdf-darkmode-floating-btn';
      btn.title = 'PDF Dark Mode (Click to toggle, or press Alt+Shift+D)';

      // Dragging logic
      let isDragging = false;
      let startX, startY, origX, origY, hasMoved = false;

      btn.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = btn.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        btn.style.transition = 'none';
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
        btn.style.left = `${Math.max(10, Math.min(window.innerWidth - 120, origX + dx))}px`;
        btn.style.top = `${Math.max(10, Math.min(window.innerHeight - 50, origY + dy))}px`;
        btn.style.bottom = 'auto';
        btn.style.right = 'auto';
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          btn.style.transition = '';
        }
      });

      btn.addEventListener('click', () => {
        if (hasMoved) return; // Prevent toggle if user was dragging
        toggleDarkMode();
      });

      const target = document.documentElement || document.body;
      if (target) target.appendChild(btn);
    }

    // Update button contents based on active state
    if (isEnabled) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <span class="btn-text">Aura +999</span>
      `;
    } else {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span class="btn-text">Aura -999</span>
      `;
    }
  }

  function removeFloatingButton() {
    const btn = document.getElementById('pdf-darkmode-floating-btn');
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  }

  // Construct CSS filter string based on settings
  function buildFilterString() {
    const themeKey = currentSettings.theme || 'charcoal';

    if (themeKey !== 'custom' && PRESET_FILTERS[themeKey]) {
      let f = PRESET_FILTERS[themeKey];
      if (currentSettings.warmth > 0) {
        f += ` sepia(${(currentSettings.warmth / 100 * 0.45).toFixed(2)})`;
      }
      return f;
    }

    // Custom mode
    const inv = ((currentSettings.invertLevel || 92) / 100).toFixed(2);
    const bright = ((currentSettings.brightness || 95) / 100).toFixed(2);
    const cont = ((currentSettings.contrast || 95) / 100).toFixed(2);
    const sep = Math.max(
      (currentSettings.sepia || 0) / 100,
      (currentSettings.warmth || 0) / 100 * 0.45
    ).toFixed(2);

    return `invert(${inv}) hue-rotate(180deg) brightness(${bright}) contrast(${cont}) sepia(${sep})`;
  }

  // Apply visual dark mode styles
  function renderDarkMode() {
    const shouldBeActive = (currentSettings.enabled && (isPagePDF || forceActive));

    updateFloatingButton(shouldBeActive);

    const docEl = document.documentElement;
    if (!docEl) return;

    if (!shouldBeActive) {
      docEl.style.filter = '';
      docEl.classList.remove('pdf-darkmode-active');
      return;
    }

    // Apply hardware-accelerated CSS filter directly to root document
    docEl.style.filter = buildFilterString();
    docEl.classList.add('pdf-darkmode-active');
  }

  // Toggle dark mode function (bulletproof against context invalidation)
  async function toggleDarkMode() {
    const newState = !currentSettings.enabled;
    forceActive = true;
    currentSettings.enabled = newState;

    // Apply visual change immediately
    renderDarkMode();

    // Safely save to storage
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set({ enabled: newState });
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ enabled: newState });
      }
    } catch (e) {
      // Storage unavailable or context invalidated after extension reload
      console.warn('[PDF Dark Mode] Storage skipped:', e?.message || e);
    }

    // Safely update badge in background
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'UPDATE_BADGE' }, () => {
          // Swallow lastError if background worker is asleep or reloaded
          void chrome.runtime.lastError;
        });
      }
    } catch (e) {
      // Context invalidated
    }
  }

  // Listen for storage changes in real-time
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        for (const key in changes) {
          currentSettings[key] = changes[key].newValue;
        }
        renderDarkMode();
      });
    }
  } catch (e) {}

  // Listen for messages from popup or background service worker
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'GET_STATUS') {
          sendResponse({
            isPDF: isPagePDF || forceActive,
            isLocalFile: location.protocol === 'file:',
            url: location.href,
            settings: currentSettings
          });
          return true;
        }

        if (message.action === 'APPLY_SETTINGS') {
          if (message.settings) {
            currentSettings = { ...currentSettings, ...message.settings };
          }
          forceActive = true;
          renderDarkMode();
          sendResponse({ success: true, settings: currentSettings });
          return true;
        }

        if (message.action === 'TOGGLE_DARK_MODE') {
          toggleDarkMode().then(() => sendResponse({ success: true, enabled: currentSettings.enabled }));
          return true;
        }
      });
    }
  } catch (e) {}

  // Initialize
  async function init() {
    isPagePDF = detectPDF();

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        const stored = await chrome.storage.sync.get(null);
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };
      }
    } catch (e) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const stored = await chrome.storage.local.get(null);
          currentSettings = { ...DEFAULT_SETTINGS, ...stored };
        }
      } catch (err) {}
    }

    // Auto apply if enabled and detected
    if (currentSettings.enabled && currentSettings.autoEnable && isPagePDF) {
      renderDarkMode();
    } else if (currentSettings.showFloatingButton && isPagePDF) {
      updateFloatingButton(false);
    }
  }

  // Run on load and observe dynamic DOM changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    if (!isPagePDF) {
      isPagePDF = detectPDF();
      if (isPagePDF) init();
    }
  });

  const observer = new MutationObserver(() => {
    if (!isPagePDF && detectPDF()) {
      isPagePDF = true;
      init();
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
