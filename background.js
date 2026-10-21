// Default extension settings
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

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const existing = await chrome.storage.sync.get(null);
    const updated = { ...DEFAULT_SETTINGS, ...existing };
    await chrome.storage.sync.set(updated);
    console.log('[PDF Dark Mode Pro] Initialized settings:', updated);
  } catch (err) {
    console.warn('[PDF Dark Mode Pro] Storage sync failed, falling back to local:', err);
    await chrome.storage.local.set(DEFAULT_SETTINGS);
  }
});

// Update extension badge on active tab
async function updateBadge(tabId) {
  try {
    const data = await chrome.storage.sync.get(['enabled']);
    const isEnabled = data.enabled !== false;
    
    if (tabId) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: isEnabled ? 'ON' : 'OFF'
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: isEnabled ? '#10b981' : '#6b7280'
      });
    }
  } catch (e) {
    // Ignore errors for restricted tabs
  }
}

// Handle keyboard shortcut (e.g., Alt+Shift+D)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-dark-mode') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Toggle global setting
    const current = await chrome.storage.sync.get(['enabled']);
    const newState = !(current.enabled !== false);
    await chrome.storage.sync.set({ enabled: newState });

    // Send toggle message to tab
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'APPLY_SETTINGS',
        settings: { enabled: newState }
      });
    } catch (err) {
      // If content script is not yet injected, inject dynamically
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (injectErr) {
        console.warn('Could not inject content script:', injectErr);
      }
    }

    updateBadge(tab.id);
  }
});

// Handle tab activation & updates
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadge(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateBadge(tabId);
  }
});

// Handle messages from popup / content
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_EXTENSION_SETTINGS') {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'OPEN_SHORTCUTS_PAGE') {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'CHECK_FILE_ACCESS') {
    chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
      sendResponse({ isAllowed });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'UPDATE_BADGE' && sender.tab) {
    updateBadge(sender.tab.id);
    sendResponse({ success: true });
    return true;
  }
});
