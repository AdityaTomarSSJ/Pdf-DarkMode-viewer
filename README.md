# PDF Dark Mode Pro - Chrome Extension 🌙📄

> A powerful, eye-comfort Chrome extension designed to transform blinding white PDF documents into a smooth, readable dark mode with multiple themes, custom brightness and contrast adjustments, and instant keyboard shortcuts.

---

## ✨ Features

- **🌙 6 Handcrafted Dark Reading Themes**:
  - **Charcoal Night** *(Default)*: Soft eye-comfort dark grey (`#181818`), eliminates harsh glare while maintaining natural reading contrast.
  - **OLED Black**: Pitch black (`#000000`), maximum contrast, saves battery on OLED displays.
  - **Warm Sepia**: Amber night-reading tone, filters out harsh blue light.
  - **Midnight Slate**: Cool slate-navy dark theme inspired by modern developer IDEs.
  - **Nordic Frost**: Arctic gray with muted cyan accents.
  - **Cyber Matrix**: Retro green phosphor glow on deep black.
  - **Custom Theme**: Fine-tune every aspect with interactive sliders.

- **🎛️ Real-Time Fine-Tuning Controls**:
  - **Brightness Slider**: 60% – 140%
  - **Contrast Slider**: 60% – 140%
  - **Warmth / Blue Light Filter**: 0% – 100%
  - **Invert Intensity**: 70% – 100%

- **⚡ Quick Actions & Usability**:
  - **Instant Keyboard Shortcut**: Press `Alt + Shift + D` (or `Cmd + Shift + D` on Mac) to toggle dark mode on and off instantly without touching the mouse.
  - **On-Screen Floating Toggle Button**: A subtle, draggable floating button on the bottom corner of the PDF for 1-click toggling.
  - **Auto-Enable on PDFs**: Automatically darkens every PDF opened in Chrome.
  - **Print Protection**: Automatically disables dark mode when you print (`Ctrl + P`), saving ink and toner.

- **🔒 100% Private & Local**:
  - Runs completely offline inside your browser. No files, documents, or data are ever sent over the network.

---

## 🚀 How to Install in Google Chrome

1. **Open the Extensions Page in Chrome**:
   - In Chrome's address bar, type `chrome://extensions` and press **Enter**.
   - Or click the **Three Dots Menu** (top-right) → **Extensions** → **Manage Extensions**.

2. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **"Developer mode"** switch to **ON**.

3. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top-left toolbar.
   - Select the folder:
     ```
     D:\Projects\darkmode
     ```
   - Click **Select Folder**.

4. **Pin the Extension**:
   - Click the **Puzzle Piece icon** (Extensions) in Chrome's top toolbar.
   - Click the **Pin** icon next to **PDF Dark Mode Pro** for quick access.

---

## ⚠️ Important Note for Local PDFs (`file:///`)

By default, Chrome prevents all extensions from accessing local files stored on your computer. If you open PDFs directly from your hard drive (`file:///...`):

1. Go to `chrome://extensions`.
2. Find **PDF Dark Mode Pro** and click **Details**.
3. Scroll down and toggle **ON** the switch:
   > **"Allow access to file URLs"**
4. Refresh any opened local PDF tab.

---

## ⌨️ Keyboard Shortcuts

| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Toggle Dark Mode** | `Alt + Shift + D` | `Option + Shift + D` |

> *To customize this shortcut, go to `chrome://extensions/shortcuts` in Chrome.*

---

## 📁 Project Structure

```
d:/Projects/darkmode/
├── manifest.json         # Manifest V3 configuration
├── background.js         # Service worker handling commands and tab badge
├── content.js            # Inversion engine, theme applicator, floating button
├── content.css           # Overlay styling, animations, and print media rules
├── popup.html            # Extension popup interface
├── popup.css             # Dark modern popup stylesheet
├── popup.js              # Controller for presets, sliders, and storage sync
├── icons/                # High-res extension icons (16, 32, 48, 128 px)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── test.pdf              # Sample PDF for testing
└── README.md             # Documentation and usage guide
```

---

## 🛠️ How It Works Under the Hood

1. **Non-destructive Inversion**: Chrome renders PDFs inside a native plugin container. Standard element filters often fail or distort text selection. PDF Dark Mode Pro injects a hardware-accelerated viewport overlay using CSS `mix-blend-mode: difference` combined with tone adjustment layers (`multiply`/`screen`) and `backdrop-filter`.
2. **Text Selection & Scroll Preservation**: The overlay uses `pointer-events: none` and GPU containment, ensuring all scroll physics, mouse selection, copying, zooming, and links remain fully responsive.
3. **Ink-Friendly Printing**: Utilizes `@media print` rules to automatically deactivate the overlay during print previews, guaranteeing clean white paper output.
