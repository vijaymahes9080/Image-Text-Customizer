/**
 * Image Text Customizer - Main Application Orchestrator
 */

class App {
  constructor() {
    this.currentFile = null;
    this.currentFileName = 'customized_image';
    this.currentFilters = {
      brightness: 100,
      contrast: 100,
      saturation: 100
    };

    this.initEngines();
    this.initDOM();
    this.bindEvents();
    this.applyTheme('dark');

    // Load saved language or default
    const savedLang = localStorage.getItem('itc_lang') || 'en';
    ITCUtils.setLanguage(savedLang);
  }

  initEngines() {
    this.canvasEl = document.getElementById('mainCanvas');
    this.canvasContainer = document.getElementById('canvasWorkspace');

    this.canvasEditor = new CanvasEditor(this.canvasEl, this.canvasContainer);
    this.history = new HistoryManager();
    this.textEditor = new TextEditor(this.canvasEditor, this.history);
    this.ocr = new OCREngine();
    this.exporter = new ExportEngine(this.canvasEditor);

    // Canvas Editor callbacks
    this.canvasEditor.onSelectCallback = (obj, screenPos) => {
      this.textEditor.select(obj);
      this.textEditor.updateFloatingToolbarPosition(screenPos);
      this.updateLayersUI();
    };

    this.canvasEditor.onOpenQuickEditCallback = (obj) => {
      this.textEditor.openQuickEdit();
    };

    this.canvasEditor.onObjectsChangeCallback = (objects, selectedId) => {
      this.updateLayersUI();
    };

    this.canvasEditor.onHistoryPushCallback = (state, action) => {
      this.history.pushState(state, action);
    };

    this.canvasEditor.onStatusChangeCallback = (status) => {
      this.updateStatusBar(status);
    };

    // History Manager callbacks
    this.history.setChangeCallback((hist) => {
      const btnUndo = document.getElementById('toolUndo');
      const btnRedo = document.getElementById('toolRedo');
      if (btnUndo) btnUndo.disabled = !hist.canUndo;
      if (btnRedo) btnRedo.disabled = !hist.canRedo;
    });
  }

  initDOM() {
    this.dom = {
      // Views & Screens
      uploadScreen: document.getElementById('uploadScreen'),
      editorScreen: document.getElementById('editorScreen'),
      fileInput: document.getElementById('fileInput'),
      dropzone: document.getElementById('dropzone'),
      btnChooseImage: document.getElementById('btnChooseImage'),

      // Sample image buttons
      btnSamplePoster: document.getElementById('btnSamplePoster'),
      btnSampleTamil: document.getElementById('btnSampleTamil'),
      btnSampleCert: document.getElementById('btnSampleCert'),

      // Header tools
      themeToggle: document.getElementById('themeToggle'),
      langSelect: document.getElementById('langSelect'),
      btnHelp: document.getElementById('btnHelp'),
      btnNavUpload: document.getElementById('navUpload'),
      btnNavExport: document.getElementById('navExport'),

      // Left Toolbar
      toolSelect: document.getElementById('toolSelect'),
      toolAddText: document.getElementById('toolAddText'),
      toolDetectText: document.getElementById('toolDetectText'),
      toolPan: document.getElementById('toolPan'),
      toolSplitPreview: document.getElementById('toolSplitPreview'),
      toolUndo: document.getElementById('toolUndo'),
      toolRedo: document.getElementById('toolRedo'),

      // Zoom Controls
      btnZoomIn: document.getElementById('btnZoomIn'),
      btnZoomOut: document.getElementById('btnZoomOut'),
      btnZoomFit: document.getElementById('btnZoomFit'),
      btnZoom100: document.getElementById('btnZoom100'),
      btnZoom200: document.getElementById('btnZoom200'),
      btnHoldBefore: document.getElementById('btnHoldBefore'),

      // OCR Controls
      ocrLanguage: document.getElementById('ocrLanguage'),
      ocrProgressBar: document.getElementById('ocrProgressBar'),
      ocrProgressFill: document.getElementById('ocrProgressFill'),
      ocrStatusText: document.getElementById('ocrStatusText'),

      // Right Panel Tabs & Content
      tabBtns: document.querySelectorAll('.panel-tab-btn'),
      tabPanels: document.querySelectorAll('.panel-tab-content'),
      layersList: document.getElementById('layersList'),
      btnAddTextFromLayers: document.getElementById('btnAddTextFromLayers'),

      // Image Adjustments
      filterBrightness: document.getElementById('filterBrightness'),
      filterBrightnessVal: document.getElementById('filterBrightnessVal'),
      filterContrast: document.getElementById('filterContrast'),
      filterContrastVal: document.getElementById('filterContrastVal'),
      filterSaturation: document.getElementById('filterSaturation'),
      filterSaturationVal: document.getElementById('filterSaturationVal'),
      btnResetFilters: document.getElementById('btnResetFilters'),

      // Status Bar
      statusDim: document.getElementById('statusDim'),
      statusSize: document.getElementById('statusSize'),
      statusZoom: document.getElementById('statusZoom'),
      statusOCR: document.getElementById('statusOCR'),

      // Modals
      helpModal: document.getElementById('helpModal'),
      btnHelpClose: document.getElementById('btnHelpClose'),
      exportModal: document.getElementById('exportModal'),
      btnExportClose: document.getElementById('btnExportClose'),
      exportFormat: document.getElementById('exportFormat'),
      exportQualityGroup: document.getElementById('exportQualityGroup'),
      exportQuality: document.getElementById('exportQuality'),
      exportQualityVal: document.getElementById('exportQualityVal'),
      exportResNote: document.getElementById('exportResNote'),
      btnDownloadFinal: document.getElementById('btnDownloadFinal')
    };
  }

  bindEvents() {
    // File Upload: Drag and Drop
    const dropzone = this.dom.dropzone;
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    this.dom.btnChooseImage.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Sample Images
    this.dom.btnSamplePoster.addEventListener('click', () => this.loadSampleImage('poster'));
    this.dom.btnSampleTamil.addEventListener('click', () => this.loadSampleImage('tamil'));
    this.dom.btnSampleCert.addEventListener('click', () => this.loadSampleImage('certificate'));

    // Navigation buttons
    this.dom.btnNavUpload.addEventListener('click', () => {
      this.dom.editorScreen.style.display = 'none';
      this.dom.uploadScreen.style.display = 'flex';
    });

    this.dom.btnNavExport.addEventListener('click', () => this.openExportModal());

    // Theme & Language
    this.dom.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      this.applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    this.dom.langSelect.addEventListener('change', (e) => {
      ITCUtils.setLanguage(e.target.value);
    });

    // Help Modal
    this.dom.btnHelp.addEventListener('click', () => this.dom.helpModal.classList.add('active'));
    this.dom.btnHelpClose.addEventListener('click', () => this.dom.helpModal.classList.remove('active'));

    // Left Tools
    this.dom.toolSelect.addEventListener('click', () => this.setActiveTool('select'));
    this.dom.toolAddText.addEventListener('click', () => this.setActiveTool('text'));
    this.dom.toolPan.addEventListener('click', () => this.setActiveTool('pan'));

    this.dom.toolDetectText.addEventListener('click', () => {
      this.runOCR();
    });

    this.dom.toolSplitPreview.addEventListener('click', () => {
      this.canvasEditor.isSplitView = !this.canvasEditor.isSplitView;
      this.dom.toolSplitPreview.classList.toggle('active', this.canvasEditor.isSplitView);
      this.canvasEditor.render();
    });

    this.dom.toolUndo.addEventListener('click', () => this.undo());
    this.dom.toolRedo.addEventListener('click', () => this.redo());

    // Zoom Controls
    this.dom.btnZoomIn.addEventListener('click', () => this.canvasEditor.setZoom(this.canvasEditor.zoom * 1.25));
    this.dom.btnZoomOut.addEventListener('click', () => this.canvasEditor.setZoom(this.canvasEditor.zoom / 1.25));
    this.dom.btnZoomFit.addEventListener('click', () => this.canvasEditor.fitToScreen());
    this.dom.btnZoom100.addEventListener('click', () => this.canvasEditor.setZoom(1.0));
    this.dom.btnZoom200.addEventListener('click', () => this.canvasEditor.setZoom(2.0));

    // Hold Before Button
    const startHold = () => {
      this.canvasEditor.isHoldingBefore = true;
      this.canvasEditor.render();
    };
    const endHold = () => {
      this.canvasEditor.isHoldingBefore = false;
      this.canvasEditor.render();
    };
    this.dom.btnHoldBefore.addEventListener('mousedown', startHold);
    window.addEventListener('mouseup', endHold);
    this.dom.btnHoldBefore.addEventListener('touchstart', startHold);
    window.addEventListener('touchend', endHold);

    // Right Panel Tabs
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.dom.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
        this.dom.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
      });
    });

    this.dom.btnAddTextFromLayers.addEventListener('click', () => {
      const cx = this.canvasEditor.imageWidth / 2;
      const cy = this.canvasEditor.imageHeight / 2;
      this.canvasEditor.addCustomText(cx, cy);
    });

    // Image Adjustments
    this.dom.filterBrightness.addEventListener('input', (e) => {
      this.currentFilters.brightness = parseInt(e.target.value, 10);
      this.dom.filterBrightnessVal.textContent = `${this.currentFilters.brightness}%`;
      this.updateCanvasFilter();
    });

    this.dom.filterContrast.addEventListener('input', (e) => {
      this.currentFilters.contrast = parseInt(e.target.value, 10);
      this.dom.filterContrastVal.textContent = `${this.currentFilters.contrast}%`;
      this.updateCanvasFilter();
    });

    this.dom.filterSaturation.addEventListener('input', (e) => {
      this.currentFilters.saturation = parseInt(e.target.value, 10);
      this.dom.filterSaturationVal.textContent = `${this.currentFilters.saturation}%`;
      this.updateCanvasFilter();
    });

    this.dom.btnResetFilters.addEventListener('click', () => {
      this.currentFilters = { brightness: 100, contrast: 100, saturation: 100 };
      this.dom.filterBrightness.value = 100;
      this.dom.filterBrightnessVal.textContent = '100%';
      this.dom.filterContrast.value = 100;
      this.dom.filterContrastVal.textContent = '100%';
      this.dom.filterSaturation.value = 100;
      this.dom.filterSaturationVal.textContent = '100%';
      this.updateCanvasFilter();
    });

    // Export Dialog
    this.dom.btnExportClose.addEventListener('click', () => this.dom.exportModal.classList.remove('active'));
    this.dom.exportFormat.addEventListener('change', (e) => {
      const isJpg = e.target.value === 'jpeg';
      this.dom.exportQualityGroup.style.display = isJpg ? 'block' : 'none';
    });
    this.dom.exportQuality.addEventListener('input', (e) => {
      this.dom.exportQualityVal.textContent = `${e.target.value}%`;
    });
    this.dom.btnDownloadFinal.addEventListener('click', () => {
      this.dom.exportModal.classList.remove('active');
      this.exporter.downloadImage({
        format: this.dom.exportFormat.value,
        quality: parseInt(this.dom.exportQuality.value, 10) / 100,
        originalFilename: this.currentFileName,
        filters: this.currentFilters
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.canvasEditor.selectedId) {
          e.preventDefault();
          this.canvasEditor.deleteObject(this.canvasEditor.selectedId);
        }
      } else if (e.key.toLowerCase() === 'v') {
        this.setActiveTool('select');
      } else if (e.key.toLowerCase() === 't') {
        this.setActiveTool('text');
      } else if (e.key.toLowerCase() === 'h') {
        this.setActiveTool('pan');
      }
    });
  }

  setActiveTool(tool) {
    this.canvasEditor.activeTool = tool;
    this.dom.toolSelect.classList.toggle('active', tool === 'select');
    this.dom.toolAddText.classList.toggle('active', tool === 'text');
    this.dom.toolPan.classList.toggle('active', tool === 'pan');

    if (tool === 'text') {
      ITCUtils.showToast('Click anywhere on canvas to place text', 'info', 2500);
      this.canvasEl.style.cursor = 'crosshair';
    } else if (tool === 'pan') {
      this.canvasEl.style.cursor = 'grab';
    } else {
      this.canvasEl.style.cursor = 'default';
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('itc_theme', theme);
    this.dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  handleFileUpload(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      ITCUtils.showToast('Unsupported format! Please upload PNG, JPG, or WEBP.', 'error');
      return;
    }

    this.currentFile = file;
    this.currentFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.dom.uploadScreen.style.display = 'none';
        this.dom.editorScreen.style.display = 'flex';

        this.canvasEditor.loadImage(img);
        this.history.clear();
        this.history.pushState(this.canvasEditor.textObjects, 'Initial Image');

        ITCUtils.showToast(
          ITCUtils.getTranslation('imageLoaded', { name: file.name }),
          'success'
        );

        // Automatically trigger OCR detection
        setTimeout(() => this.runOCR(), 300);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Generates crisp, high-resolution sample posters on the fly
   * for instant demonstration and verification.
   */
  loadSampleImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (type === 'poster') {
      // Tech / Cybersecurity poster
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);

      // Card container
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(100, 80, 1000, 640, 24);
      ctx.fill();

      // Poster Header
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 54px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DIGITAL SAFETY AWARENESS', 600, 220);

      // Subtitle
      ctx.fillStyle = '#94a3b8';
      ctx.font = '32px Arial';
      ctx.fillText('Protect your personal identity & data online', 600, 310);

      // Accent Box
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(350, 400, 500, 90, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('FUTURE RESILIENT 2026', 600, 458);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '22px Arial';
      ctx.fillText('Gandhigram Rural Institute • Global Security Initiative', 600, 620);

      this.currentFileName = 'digital_safety_poster.png';
    } else if (type === 'tamil') {
      // Tamil Awareness Banner
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#1a1005');
      grad.addColorStop(1, '#3b1c05');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);

      // Banner card
      ctx.fillStyle = '#291809';
      ctx.beginPath();
      ctx.roundRect(80, 80, 1040, 640, 20);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 50px "Noto Sans Tamil", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('இணையப் பாதுகாப்பு விழிப்புணர்வு', 600, 230);

      ctx.fillStyle = '#fed7aa';
      ctx.font = '34px "Noto Sans Tamil", Arial';
      ctx.fillText('உங்கள் தனிப்பட்ட தரவு உங்கள் உரிமை', 600, 330);

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(320, 420, 560, 84, 14);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Noto Sans Tamil", Arial';
      ctx.fillText('2026 விழிப்புணர்வு இயக்கம்', 600, 474);

      ctx.fillStyle = '#a8a29e';
      ctx.font = '24px "Noto Sans Tamil", Arial';
      ctx.fillText('அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை • தமிழ்நாடு', 600, 610);

      this.currentFileName = 'tamil_awareness_banner.png';
      // Pre-select Tamil language OCR
      this.dom.ocrLanguage.value = 'tam';
    } else {
      // Achievement Certificate
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1200, 800);

      // Border frame
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, 1120, 720);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, 1090, 690);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 50px "Times New Roman"';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICATE OF RECOGNITION', 600, 180);

      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 26px Georgia';
      ctx.fillText('THIS IS PROUDLY PRESENTED TO', 600, 260);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 46px "Times New Roman"';
      ctx.fillText('VIJAY MAHES', 600, 350);

      ctx.fillStyle = '#475569';
      ctx.font = '24px Georgia';
      ctx.fillText('FOR EXCELLENCE IN CLIENT-SIDE WEB ENGINEERING', 600, 430);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 28px Arial';
      ctx.fillText('GLOBAL AI SUMMIT 2026', 600, 530);

      this.currentFileName = 'achievement_certificate.png';
    }

    const img = new Image();
    img.onload = () => {
      this.dom.uploadScreen.style.display = 'none';
      this.dom.editorScreen.style.display = 'flex';

      this.canvasEditor.loadImage(img);
      this.history.clear();
      this.history.pushState(this.canvasEditor.textObjects, 'Load Sample');

      ITCUtils.showToast(`Sample loaded: ${this.currentFileName}`, 'success');
      setTimeout(() => this.runOCR(), 300);
    };
    img.src = canvas.toDataURL('image/png');
  }

  async runOCR() {
    if (!this.canvasEditor.image || this.ocr.isProcessing) return;

    const lang = this.dom.ocrLanguage.value;
    const btnDetect = this.dom.toolDetectText;
    if (btnDetect) btnDetect.disabled = true;

    this.dom.ocrProgressBar.style.display = 'block';
    this.dom.ocrProgressFill.style.width = '10%';
    this.dom.ocrStatusText.textContent = ITCUtils.getTranslation('ocrDetecting');

    try {
      const regions = await this.ocr.detectText(
        this.canvasEditor.sourceCanvas,
        lang,
        (progress) => {
          const pct = Math.round((progress.progress || 0.3) * 100);
          this.dom.ocrProgressFill.style.width = `${Math.max(10, Math.min(100, pct))}%`;
          this.dom.ocrStatusText.textContent = `${progress.status || 'OCR'}: ${pct}%`;
        }
      );

      this.dom.ocrProgressBar.style.display = 'none';

      if (regions && regions.length > 0) {
        this.canvasEditor.setOCRRegions(regions);
        const successMsg = ITCUtils.getTranslation('ocrSuccess', { count: regions.length });
        ITCUtils.showToast(`${successMsg} • Click or double-click any text to edit!`, 'success', 4000);
        this.dom.ocrStatusText.textContent = `${regions.length} text regions detected (Click or double-click to edit)`;
      } else {
        ITCUtils.showToast('No reliable text was detected automatically. You can still add text manually.', 'info', 4500);
        this.dom.ocrStatusText.textContent = 'No text detected. Use "Add Text" manually.';
      }
    } catch (err) {
      console.warn('OCR execution notice:', err);
      this.dom.ocrProgressBar.style.display = 'none';
      const userMsg = err.message && err.message.includes('Tamil')
        ? err.message
        : (ITCUtils.getTranslation('ocrFail') || 'Text detection could not be completed. You can still add text manually.');
      ITCUtils.showToast(userMsg, 'warning', 5000);
      this.dom.ocrStatusText.textContent = 'Manual text editing ready.';
    } finally {
      if (btnDetect) btnDetect.disabled = false;
    }
  }

  updateLayersUI() {
    const list = this.dom.layersList;
    list.innerHTML = '';

    const objects = this.canvasEditor.textObjects;
    if (objects.length === 0) {
      list.innerHTML = `<div class="empty-layers">${ITCUtils.getTranslation('noLayersMsg')}</div>`;
      return;
    }

    // Render layers in reverse display order (top layer first)
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const isSelected = obj.id === this.canvasEditor.selectedId;

      const item = document.createElement('div');
      item.className = `layer-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <button class="layer-vis-btn ${obj.visible ? 'active' : ''}" title="Toggle Visibility">
          ${obj.visible ? '👁️' : '🙈'}
        </button>
        <div class="layer-title" title="${obj.text}">
          <span class="layer-index">${i + 1}.</span>
          <span class="layer-text-preview">${obj.text || '(empty)'}</span>
        </div>
        <div class="layer-actions">
          <button class="layer-btn-reorder" data-dir="up" title="Move Up">▲</button>
          <button class="layer-btn-reorder" data-dir="down" title="Move Down">▼</button>
          <button class="layer-btn-delete" title="Delete">✕</button>
        </div>
      `;

      // Click to select
      item.querySelector('.layer-title').addEventListener('click', () => {
        this.canvasEditor.selectObject(obj.id);
        this.canvasEditor.render();
      });

      // Visibility toggle
      item.querySelector('.layer-vis-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.canvasEditor.toggleObjectVisibility(obj.id);
      });

      // Reorder buttons
      item.querySelectorAll('.layer-btn-reorder').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.canvasEditor.reorderObject(obj.id, btn.dataset.dir);
        });
      });

      // Delete button
      item.querySelector('.layer-btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(ITCUtils.getTranslation('confirmDelete'))) {
          this.canvasEditor.deleteObject(obj.id);
        }
      });

      list.appendChild(item);
    }
  }

  updateCanvasFilter() {
    this.canvasEl.style.filter = `brightness(${this.currentFilters.brightness}%) contrast(${this.currentFilters.contrast}%) saturate(${this.currentFilters.saturation}%)`;
  }

  updateStatusBar(status) {
    if (this.dom.statusDim) {
      this.dom.statusDim.textContent = `${status.width} × ${status.height} px`;
    }
    if (this.dom.statusSize) {
      this.dom.statusSize.textContent = this.currentFile ? ITCUtils.formatBytes(this.currentFile.size) : 'Sample';
    }
    if (this.dom.statusZoom) {
      this.dom.statusZoom.textContent = `${status.zoom}%`;
    }
    if (this.dom.statusOCR) {
      this.dom.statusOCR.textContent = `${status.ocrCount} detected`;
    }
  }

  openExportModal() {
    if (!this.canvasEditor.image) return;
    this.dom.exportResNote.textContent = `${this.canvasEditor.imageWidth} × ${this.canvasEditor.imageHeight} px`;
    this.dom.exportModal.classList.add('active');
  }

  undo() {
    const prevState = this.history.undo(this.canvasEditor.textObjects);
    if (prevState) {
      this.canvasEditor.restoreState(prevState);
      ITCUtils.showToast('Undo', 'info', 1200);
    }
  }

  redo() {
    const nextState = this.history.redo(this.canvasEditor.textObjects);
    if (nextState) {
      this.canvasEditor.restoreState(nextState);
      ITCUtils.showToast('Redo', 'info', 1200);
    }
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.itcApp = new App();
});
