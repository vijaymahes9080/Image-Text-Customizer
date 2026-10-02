/**
 * Image Text Customizer - Utilities & I18N Module
 */

// Comprehensive English and Tamil Translations
const TRANSLATIONS = {
  en: {
    appTitle: "Image Text Customizer",
    tagline: "Detect, edit, and replace text in any image locally in your browser",
    privacyBadge: "100% Client-Side • Private & Secure",
    navUpload: "Upload",
    navEdit: "Edit",
    navPreview: "Preview",
    navExport: "Export",
    dropzoneTitle: "Drag & drop your image here",
    dropzoneSubtitle: "Supports PNG, JPG, JPEG, WEBP (Full resolution preserved)",
    chooseImageBtn: "Choose Image",
    orSample: "Or try a sample image:",
    samplePoster1: "Digital Safety Poster",
    sampleTamil: "Tamil Awareness Banner",
    sampleCertificate: "Achievement Certificate",
    toolSelect: "Select Tool (V)",
    toolAddText: "Add Text (T)",
    toolDetectText: "Detect Text (OCR)",
    toolPan: "Pan Canvas (H / Space)",
    toolSplitPreview: "Before / After Split",
    toolUndo: "Undo (Ctrl+Z)",
    toolRedo: "Redo (Ctrl+Y)",
    tabText: "Text Properties",
    tabLayers: "Layers",
    tabImage: "Image Adjustments",
    noSelectionMsg: "Select a text layer or click text on canvas to edit properties",
    textContentLabel: "Text Content",
    fontFamilyLabel: "Font Family",
    fontSizeLabel: "Font Size",
    fontColorLabel: "Text Color",
    fontWeightLabel: "Font Weight",
    textStyleLabel: "Style",
    textAlignLabel: "Alignment",
    opacityLabel: "Opacity",
    letterSpacingLabel: "Letter Spacing",
    lineHeightLabel: "Line Height",
    rotationLabel: "Rotation",
    bgRepairHeading: "Original Text Removal / Background Repair",
    bgRepairToggle: "Erase original background text",
    bgRepairMethod: "Repair Method",
    methodAuto: "Intelligent Auto",
    methodInpaint: "Patch Inpainting",
    methodGradient: "Gradient Interpolation",
    methodSolid: "Solid Color Sample",
    bgPaddingLabel: "Repair Expansion (px)",
    layersTitle: "Text Layers",
    addTextBtn: "+ Add Custom Text",
    noLayersMsg: "No text layers yet. Run 'Detect Text' or click 'Add Custom Text'.",
    brightnessLabel: "Brightness",
    contrastLabel: "Contrast",
    saturationLabel: "Saturation",
    resetFiltersBtn: "Reset Adjustments",
    zoomIn: "Zoom In (+)",
    zoomOut: "Zoom Out (-)",
    zoomFit: "Fit to View",
    zoom100: "100% Scale",
    zoom200: "200% Scale",
    beforeAfterBtn: "Hold to View Original",
    splitViewBtn: "Split Preview",
    exportBtn: "Export Image",
    exportDialogTitle: "Export Edited Image",
    formatLabel: "Format",
    jpgQualityLabel: "JPEG Quality",
    exportOriginalResNote: "Will be rendered at full original resolution:",
    downloadBtn: "Download File",
    closeBtn: "Close",
    ocrLangLabel: "OCR Language:",
    ocrLangEng: "English",
    ocrLangTam: "Tamil (தமிழ்)",
    ocrLangEngTam: "English + Tamil",
    ocrDetecting: "Detecting text with OCR...",
    ocrSuccess: "{count} text regions detected successfully",
    ocrFail: "Text detection could not be completed. You can still add text manually.",
    ocrReady: "Ready for text detection",
    helpTitle: "How to use Image Text Customizer",
    helpClose: "Got it!",
    statusDimensions: "Dimensions:",
    statusSize: "Size:",
    statusZoom: "Zoom:",
    statusRegions: "Text Regions:",
    floatingEdit: "Edit",
    floatingDuplicate: "Duplicate",
    floatingDelete: "Delete",
    floatingApply: "Apply",
    floatingCancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this text object?",
    textAdded: "New text added",
    imageLoaded: "Image loaded: {name}",
    exportSuccess: "Image exported successfully"
  },
  ta: {
    appTitle: "பட உரை திருத்தி (Image Text Customizer)",
    tagline: "உங்கள் உலாவியிலேயே படத்தின் உரைகளைக் கண்டறிந்து, திருத்தி மாற்றவும்",
    privacyBadge: "100% உலாவி அடிப்படையிலானது • முழு பாதுகாப்பு",
    navUpload: "பதிவேற்று",
    navEdit: "திருத்து",
    navPreview: "முன்னோட்டம்",
    navExport: "ஏற்றுமதி",
    dropzoneTitle: "படத்தை இங்கே இழுத்து விடவும்",
    dropzoneSubtitle: "PNG, JPG, JPEG, WEBP ஆதரிக்கப்படுகிறது (முழுத் தரம் காக்கப்படும்)",
    chooseImageBtn: "படத்தைத் தேர்வுசெய்",
    orSample: "அல்லது மாதிரிப் படத்தைப் பயன்படுத்துக:",
    samplePoster1: "டிஜிட்டல் பாதுகாப்பு சுவரொட்டி",
    sampleTamil: "தமிழ் விழிப்புணர்வு பதாகை",
    sampleCertificate: "சான்றிதழ் மாதிரி",
    toolSelect: "தேர்வு கருவி (V)",
    toolAddText: "உரை சேர்க்க (T)",
    toolDetectText: "உரையைக் கண்டறி (OCR)",
    toolPan: "படத்தை நகர்த்து (H / Space)",
    toolSplitPreview: "முன் / பின் ஒப்பீடு",
    toolUndo: "முந்தைய நிலை (Ctrl+Z)",
    toolRedo: "மீண்டும் செய் (Ctrl+Y)",
    tabText: "உரை பண்புகள்",
    tabLayers: "அடுக்குகள் (Layers)",
    tabImage: "பட சரிசெய்தல்",
    noSelectionMsg: "பண்புகளை மாற்ற உரையைத் தேர்வுசெய்யவும்",
    textContentLabel: "உரை உள்ளடக்கம்",
    fontFamilyLabel: "எழுத்துரு",
    fontSizeLabel: "எழுத்து அளவு",
    fontColorLabel: "உரை நிறம்",
    fontWeightLabel: "எழுத்து தடிமன்",
    textStyleLabel: "பாணி",
    textAlignLabel: "சீரமைப்பு",
    opacityLabel: "ஒளிபுகாமை",
    letterSpacingLabel: "எழுத்து இடைவெளி",
    lineHeightLabel: "வரி இடைவெளி",
    rotationLabel: "சுழற்சி",
    bgRepairHeading: "பழைய உரையை நீக்கி பின்னணியை மீட்டமைத்தல்",
    bgRepairToggle: "அசல் உரையை நீக்கி பின்னணியை நிரப்பு",
    bgRepairMethod: "மீட்டமைப்பு முறை",
    methodAuto: "தானியங்கி முறை",
    methodInpaint: "துணைவடிவ பொருத்தம் (Inpaint)",
    methodGradient: "வண்ண மாற்றம் (Gradient)",
    methodSolid: "ஒற்றை நிறம்",
    bgPaddingLabel: "விரிவாக்க அளவு (px)",
    layersTitle: "உரை அடுக்குகள்",
    addTextBtn: "+ புதிய உரை சேர்",
    noLayersMsg: "உரை அடுக்குகள் இல்லை. 'உரையைக் கண்டறி' அழுத்தவும் அல்லது புதிய உரை சேர்க்கவும்.",
    brightnessLabel: "வெளிச்சம்",
    contrastLabel: "மாறுபாடு (Contrast)",
    saturationLabel: "வண்ணச் செறிவு",
    resetFiltersBtn: "வடிப்பான்களை மீட்டமை",
    zoomIn: "பெரிதாக்கு (+)",
    zoomOut: "சிறிதாக்கு (-)",
    zoomFit: "திரைக்குப் பொருத்து",
    zoom100: "100% அளவு",
    zoom200: "200% அளவு",
    beforeAfterBtn: "அசல் படத்தைப் பார்க்க அழுத்திப் பிடிக்கவும்",
    splitViewBtn: "இரட்டை முன்னோட்டம்",
    exportBtn: "படத்தை சேமி / ஏற்றுமதி செய்",
    exportDialogTitle: "படத்தை பதிவிறக்கு",
    formatLabel: "வடிவம்",
    jpgQualityLabel: "JPEG தரம்",
    exportOriginalResNote: "முழு அசல் தெளிவுத்திறனில் பதிவிறக்கப்படும்:",
    downloadBtn: "பதிவிறக்கு",
    closeBtn: "மூடு",
    ocrLangLabel: "OCR மொழி:",
    ocrLangEng: "ஆங்கிலம்",
    ocrLangTam: "தமிழ்",
    ocrLangEngTam: "ஆங்கிலம் + தமிழ்",
    ocrDetecting: "உரைகள் கண்டறியப்படுகின்றன...",
    ocrSuccess: "{count} உரைப் பகுதிகள் வெற்றிகரமாகக் கண்டறியப்பட்டன",
    ocrFail: "உரையைக் கண்டறிய முடியவில்லை. நீங்கள் கைமுறையாக உரை சேர்க்கலாம்.",
    ocrReady: "உரை கண்டறிய தயாராக உள்ளது",
    helpTitle: "பட உரை திருத்தியைப் பயன்படுத்துவது எப்படி?",
    helpClose: "புரிந்தது!",
    statusDimensions: "அளவு:",
    statusSize: "கோப்பு அளவு:",
    statusZoom: "பெரிதாக்கல்:",
    statusRegions: "உரை பகுதிகள்:",
    floatingEdit: "திருத்து",
    floatingDuplicate: "நகல் எடு",
    floatingDelete: "நீக்கு",
    floatingApply: "பயன்படுத்து",
    floatingCancel: "ரத்து செய்",
    confirmDelete: "இந்த உரை அடுக்கை நீக்க விரும்புகிறீர்களா?",
    textAdded: "புதிய உரை சேர்க்கப்பட்டது",
    imageLoaded: "படம் ஏற்றப்பட்டது: {name}",
    exportSuccess: "படம் வெற்றிகரமாக பதிவிறக்கப்பட்டது"
  }
};

let currentLanguage = 'en';

function getTranslation(key, params = {}) {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('itc_lang', lang);
    applyTranslations();
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = getTranslation(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = getTranslation(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = getTranslation(key);
  });
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = currentLanguage;
}

// Math and Geometry Helpers
function rotatePoint(x, y, cx, cy, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos
  };
}

function pointInRotatedRect(px, py, rx, ry, rw, rh, angleRad) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  // Rotate point back by -angleRad around rect center
  const unrotated = rotatePoint(px, py, cx, cy, -angleRad);
  return (
    unrotated.x >= rx &&
    unrotated.x <= rx + rw &&
    unrotated.y >= ry &&
    unrotated.y <= ry + rh
  );
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Color Utility Helpers
function rgbToHex(r, g, b) {
  const toHex = c => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function getLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Formatting Helpers
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileNameWithoutExt(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export to window
window.ITCUtils = {
  TRANSLATIONS,
  getTranslation,
  setLanguage,
  applyTranslations,
  rotatePoint,
  pointInRotatedRect,
  clamp,
  rgbToHex,
  hexToRgb,
  colorDistance,
  getLuminance,
  showToast,
  formatBytes,
  getFileNameWithoutExt,
  debounce
};
