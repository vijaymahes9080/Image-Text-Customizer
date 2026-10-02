/**
 * Image Text Customizer - OCR Engine
 * Client-side text detection using Tesseract.js with fallback support.
 */

class OCREngine {
  constructor() {
    this.worker = null;
    this.currentLanguage = 'eng';
    this.isInitializing = false;
    this.isProcessing = false;
  }

  /**
   * Ensure Tesseract library is loaded into the window.
   */
  async ensureLibraryLoaded() {
    if (window.Tesseract) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => {
        console.log('Tesseract.js loaded successfully from CDN');
        resolve(true);
      };
      script.onerror = () => {
        console.warn('Failed to load Tesseract.js from CDN. Offline mode will be used.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize worker for specific language.
   */
  async getWorker(language, onProgress) {
    if (this.worker && this.currentLanguage === language) {
      return this.worker;
    }

    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        console.warn('Worker terminate error:', e);
      }
      this.worker = null;
    }

    const libLoaded = await this.ensureLibraryLoaded();
    if (!libLoaded || !window.Tesseract) {
      throw new Error('Tesseract library unavailable');
    }

    onProgress && onProgress({ status: 'initializing api', progress: 0.1 });

    const worker = await window.Tesseract.createWorker(language, 1, {
      logger: m => {
        if (onProgress && m) {
          onProgress({
            status: m.status || 'processing',
            progress: m.progress !== undefined ? m.progress : 0.5
          });
        }
      }
    });

    this.worker = worker;
    this.currentLanguage = language;
    return this.worker;
  }

  /**
   * Run OCR on an image element or canvas.
   * Returns an array of detected text regions.
   */
  async detectText(imageSource, language = 'eng', onProgress = null) {
    if (this.isProcessing) {
      throw new Error('OCR is already running');
    }

    this.isProcessing = true;

    try {
      const hasTesseract = await this.ensureLibraryLoaded();

      if (hasTesseract && window.Tesseract) {
        return await this.runTesseractOCR(imageSource, language, onProgress);
      } else {
        // Fallback: visual connected-component text detector
        return await this.runVisualTextDetectionFallback(imageSource, onProgress);
      }
    } catch (err) {
      console.error('OCR Detection error:', err);
      // Try visual detector fallback if Tesseract threw an error (e.g. CORS or network fail)
      try {
        onProgress && onProgress({ status: 'Running fallback detector...', progress: 0.8 });
        return await this.runVisualTextDetectionFallback(imageSource, onProgress);
      } catch (fallbackErr) {
        console.error('Fallback detector also failed:', fallbackErr);
        throw err;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute OCR with Tesseract.js and extract discrete line/word blocks
   */
  async runTesseractOCR(imageSource, language, onProgress) {
    const worker = await this.getWorker(language, onProgress);

    onProgress && onProgress({ status: 'Recognizing text...', progress: 0.5 });
    const result = await worker.recognize(imageSource);
    const data = result.data;

    const regions = [];
    let regionId = 1;

    // We prioritize lines over whole paragraphs to keep editing granular and intuitive
    if (data.lines && data.lines.length > 0) {
      for (const line of data.lines) {
        const text = (line.text || '').trim();
        // Ignore single non-alphanumeric noise characters with low confidence
        if (!text || (text.length <= 1 && line.confidence < 60)) continue;

        const bbox = line.bbox;
        const width = bbox.x1 - bbox.x0;
        const height = bbox.y1 - bbox.y0;

        // Skip tiny noise specks
        if (width < 10 || height < 8) continue;

        regions.push({
          id: `ocr-${regionId++}`,
          text: text,
          x: Math.round(bbox.x0),
          y: Math.round(bbox.y0),
          width: Math.round(width),
          height: Math.round(height),
          confidence: Math.round(line.confidence || 85),
          words: (line.words || []).map(w => ({
            text: w.text,
            bbox: w.bbox,
            confidence: w.confidence
          }))
        });
      }
    } else if (data.words && data.words.length > 0) {
      for (const word of data.words) {
        const text = (word.text || '').trim();
        if (!text) continue;
        const bbox = word.bbox;
        regions.push({
          id: `ocr-${regionId++}`,
          text: text,
          x: Math.round(bbox.x0),
          y: Math.round(bbox.y0),
          width: Math.round(bbox.x1 - bbox.x0),
          height: Math.round(bbox.y1 - bbox.y0),
          confidence: Math.round(word.confidence || 80)
        });
      }
    }

    return regions;
  }

  /**
   * Offline / Fallback heuristic text region detector based on
   * edge gradient density and horizontal projection.
   * Ensures the app never breaks even if offline.
   */
  async runVisualTextDetectionFallback(imageSource, onProgress) {
    onProgress && onProgress({ status: 'Analyzing image contrast regions...', progress: 0.6 });

    // Draw to offscreen canvas
    const canvas = document.createElement('canvas');
    const width = imageSource.naturalWidth || imageSource.width || 800;
    const height = imageSource.naturalHeight || imageSource.height || 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageSource, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Detect high-contrast horizontal text candidate bands
    const rowEnergy = new Float32Array(height);
    const step = Math.max(1, Math.floor(width / 300));

    for (let y = 1; y < height - 1; y++) {
      let gradSum = 0;
      let count = 0;
      for (let x = 1; x < width - 1; x += step) {
        const idx = (y * width + x) * 4;
        const up = ((y - 1) * width + x) * 4;
        const down = ((y + 1) * width + x) * 4;
        const diff = Math.abs(data[idx] - data[up]) + Math.abs(data[idx] - data[down]);
        gradSum += diff;
        count++;
      }
      rowEnergy[y] = count > 0 ? gradSum / count : 0;
    }

    // Find bands with elevated high-frequency edge energy
    let avgEnergy = 0;
    for (let y = 0; y < height; y++) avgEnergy += rowEnergy[y];
    avgEnergy /= height;
    const threshold = avgEnergy * 1.35;

    const bands = [];
    let inBand = false;
    let bandStart = 0;

    for (let y = 0; y < height; y++) {
      if (rowEnergy[y] > threshold) {
        if (!inBand) {
          inBand = true;
          bandStart = y;
        }
      } else {
        if (inBand) {
          inBand = false;
          const bandHeight = y - bandStart;
          if (bandHeight >= 12 && bandHeight < height * 0.3) {
            bands.push({ y0: bandStart, y1: y, height: bandHeight });
          }
        }
      }
    }

    const regions = [];
    let idCounter = 1;

    for (const band of bands.slice(0, 10)) {
      // Find horizontal boundaries
      const yMid = Math.floor((band.y0 + band.y1) / 2);
      let minX = width;
      let maxX = 0;

      for (let x = 0; x < width; x += 4) {
        const idx = (yMid * width + x) * 4;
        const leftIdx = (yMid * width + Math.max(0, x - 2)) * 4;
        if (Math.abs(data[idx] - data[leftIdx]) > 25) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      }

      if (maxX > minX + 30) {
        regions.push({
          id: `fallback-${idCounter++}`,
          text: `Detected Text Region ${idCounter - 1}`,
          x: Math.max(0, minX - 10),
          y: Math.max(0, band.y0 - 4),
          width: Math.min(width - minX, maxX - minX + 20),
          height: band.height + 8,
          confidence: 75
        });
      }
    }

    return regions;
  }

  async destroy() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

window.OCREngine = OCREngine;
