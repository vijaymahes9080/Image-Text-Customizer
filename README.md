# 🎨 Image Studio Suite

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://vijaymahes9080.github.io/Image-Text-Customizer/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Pure Vanilla JS](https://img.shields.io/badge/Built%20With-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Privacy Guaranteed](https://img.shields.io/badge/Privacy-100%25%20Client--Side-success?style=for-the-badge)](https://vijaymahes9080.github.io/Image-Text-Customizer/)

> A high-performance, browser-native suite of intelligent image editing applications: **Image Text Customizer** and **Watermark Remover**. Runs 100% locally in your browser with zero server uploads, no subscription, and full preservation of native image resolution.

---

## 🌐 Live Hosted Web Application

Access the fully functional hosted suite directly on GitHub Pages:

### 🔗 **[https://vijaymahes9080.github.io/Image-Text-Customizer/](https://vijaymahes9080.github.io/Image-Text-Customizer/)**

- **[Image Text Customizer](https://vijaymahes9080.github.io/Image-Text-Customizer/image%20text%20changer.html)** — Detect, inpaint, and customize text on posters, certificates, and photos.
- **[Watermark Remover](https://vijaymahes9080.github.io/Image-Text-Customizer/watermark%20reomover.html)** — Detect and erase watermarks and stamps in single images or in bulk.

---

## ✨ Flagship Applications

### 1. 📝 Image Text Customizer (`image text changer.html`)

- **Multi-Pass OCR Pipeline**:
  - Powered by client-side [Tesseract.js](https://tesseract.projectnaptha.com/) supporting English (`eng`), Tamil (`tam`), or combined (`eng+tam`).
  - Automatic luminance detection and contrast inversion for light text on dark backgrounds.
  - Dynamic scaling: automatically upscales small fonts (< 1200px) by 1.5x–2.0x for precision detection.
  - Word clustering: groups nearby words along horizontal baselines into natural editable sentences without merging distant headings and footers.
  - Overlap & duplicate filtering using Intersection-over-Union (IoU > 0.45).
- **Intelligent Background Restoration / Text Inpainting**:
  - Erases the original text underneath without crude white boxes.
  - Evaluates perimeter color distribution to apply **Median Solid Fill**, **Directional Linear Gradient Interpolation**, or **Bilinear Patch Inpainting** with border feathering.
- **Style Estimation**:
  - Automatically samples foreground glyph colors, background luminance, and dimensions to estimate initial font size, color, and weight.
- **Typography & Formatting**:
  - Font families: Inter, Roboto, Arial, Times New Roman, Georgia, and **Noto Sans Tamil**.
  - Font size, weight, italic, text color, letter spacing, line height, opacity, and rotation (-180° to 180°).
  - Uppercase and lowercase quick transforms.
- **Interactive Canvas HUD**:
  - Drag to move, 4 corner resize handles, top rotation handle.
  - Zoom HUD: Zoom In, Zoom Out, 100%, 200%, Fit to View, wheel zoom.
  - Split Before / After comparison slider with draggable divider.
  - Multi-step Undo (`Ctrl+Z`) and Redo (`Ctrl+Y` / `Ctrl+Shift+Z`).
- **Bilingual Interface**:
  - Complete English and Tamil (`தமிழ்`) interface with real-time switching.

---

### 2. 💧 Watermark Remover (`watermark reomover.html`)

- **Automatic & Manual Watermark Detection**:
  - Scans image corners and overlays to identify semi-transparent watermarks and stamps.
  - Manual brush selection for custom watermarks.
- **Mathematical Reconstruction**:
  - Inverse alpha recovery and multi-pass patch synthesis to cleanly erase watermarks.
- **Batch Processing**:
  - Process entire folders or multiple image files with real-time queue progress indicators.
- **Flexible Export**:
  - Save individual cleaned images or download a consolidated ZIP archive.

---

## 🔒 Privacy & Architecture

- **100% In-Browser Execution**: Images never leave your device. All canvas transformations, inpainting, and OCR run directly in browser memory.
- **Full Resolution Preservation**: Exports are rendered against the full native dimensions of the original image (`naturalWidth` × `naturalHeight`), supporting lossless PNG and customizable JPEG (70% - 100% quality).
- **No Cloud Dependencies**: Zero Node.js or Python backend required for production serving; works as a static web application on any web host.

---

## 📂 Project Directory Structure

```
Image-Text-Customizer/
│
├── index.html                   # Suite landing portal linking both tools
├── image text changer.html      # Flagship Image Text Customizer app
├── watermark reomover.html      # Local Watermark Detection & Removal app
│
├── css/
│   └── style.css                # SaaS theme system (Dark & Light modes)
│
├── js/
│   ├── app.js                   # Application coordinator & state management
│   ├── ocr.js                   # Preprocessed multi-pass Tesseract OCR engine
│   ├── background-repair.js     # Bi-harmonic patch inpainting & gradient restoration
│   ├── canvas-editor.js         # Interactive HTML5 Canvas engine (pan, zoom, handles)
│   ├── text-editor.js           # Typography, style estimation & floating controls
│   ├── history.js               # Multi-step Undo / Redo history manager
│   ├── export.js                # Full native resolution PNG & JPEG exporter
│   └── utils.js                 # Math, color helpers, and Tamil/English I18N
│
├── .github/
│   └── workflows/
│       └── pages.yml            # Automated GitHub Pages CI/CD workflow
│
├── .gitignore                   # Ignored files and directories
├── LICENSE                      # MIT Open-Source License
├── composer.json                # Project and author metadata
└── README.md                    # Project documentation
```

---

## 🚀 Running Locally

You can run the suite locally using any static web server:

### Using Python:
```bash
# Clone the repository
git clone https://github.com/vijaymahes9080/Image-Text-Customizer.git
cd Image-Text-Customizer

# Start local server
python -m http.server 8080
```
Open **`http://localhost:8080`** in your browser.

### Using Node.js:
```bash
npx serve .
# or
npx http-server -p 8080
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select Tool |
| `T` | Add Custom Text Tool |
| `H` or `Space + Drag` | Pan Canvas Viewport |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete Selected Text Region |
| `Mouse Wheel` | Zoom in / Zoom out centered on cursor |

---

## 👤 Developer & Maintainer

- **Developer**: **Vijay Mahes**
- **Email**: [Vijaypradhap2004@gmail.com](mailto:Vijaypradhap2004@gmail.com)
- **GitHub Profile**: [@vijaymahes9080](https://github.com/vijaymahes9080)
- **Repository**: [https://github.com/vijaymahes9080/Image-Text-Customizer](https://github.com/vijaymahes9080/Image-Text-Customizer)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
