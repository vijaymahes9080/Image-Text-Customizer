/**
 * Image Text Customizer - Export Engine
 * Full-resolution client-side image rendering and file export.
 */

class ExportEngine {
  constructor(canvasEditor) {
    this.canvasEditor = canvasEditor;
  }

  /**
   * Render the complete edited artwork onto an offscreen canvas
   * at 100% full original resolution.
   */
  renderFullResolutionCanvas(filters = {}) {
    const editor = this.canvasEditor;
    if (!editor.image) {
      throw new Error('No image loaded to export');
    }

    const width = editor.imageWidth;
    const height = editor.imageHeight;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');

    // 1. Draw source image
    ctx.drawImage(editor.sourceCanvas, 0, 0);

    // 2. Perform background repair at original resolution
    const repairEngine = new BackgroundRepairEngine();
    for (const obj of editor.textObjects) {
      if (obj.visible && obj.repairBackground) {
        const box = obj.originalBox || {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height
        };

        repairEngine.repairRegion(
          ctx,
          editor.sourceCtx,
          box,
          {
            method: obj.repairMethod || 'auto',
            padding: obj.repairPadding !== undefined ? obj.repairPadding : 4,
            feather: 2
          }
        );
      }
    }

    // 3. Render all visible text objects at original resolution
    for (const obj of editor.textObjects) {
      if (!obj.visible) continue;

      ctx.save();
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
      ctx.rotate((obj.rotation || 0) * Math.PI / 180);
      if (obj.scaleX || obj.scaleY) {
        ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
      }
      ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1.0;

      // Apply shadow if present
      if (obj.shadow) {
        ctx.shadowColor = obj.shadow.color || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = obj.shadow.blur || 4;
        ctx.shadowOffsetX = obj.shadow.offsetX || 2;
        ctx.shadowOffsetY = obj.shadow.offsetY || 2;
      }

      const lines = (obj.text || '').split('\n');
      const fontSize = obj.fontSize || 32;
      const lineHeightPx = fontSize * (obj.lineHeight || 1.2);
      const fontStyle = obj.fontStyle === 'italic' ? 'italic' : 'normal';
      const fontWeight = obj.fontWeight || 'normal';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${obj.fontFamily || 'Arial'}", sans-serif`;
      ctx.fillStyle = obj.fillColor || '#000000';
      ctx.textAlign = obj.textAlign || 'left';
      ctx.textBaseline = 'middle';

      let drawX = -obj.width / 2;
      if (obj.textAlign === 'center') drawX = 0;
      else if (obj.textAlign === 'right') drawX = obj.width / 2;

      const totalTextHeight = lines.length * lineHeightPx;
      const startY = -totalTextHeight / 2 + lineHeightPx / 2;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineY = startY + i * lineHeightPx;

        // Render stroke / outline if present
        if (obj.stroke && obj.stroke.width > 0) {
          ctx.save();
          ctx.strokeStyle = obj.stroke.color || '#000000';
          ctx.lineWidth = obj.stroke.width * 2;
          ctx.lineJoin = 'round';
          if (obj.letterSpacing && obj.letterSpacing !== 0) {
            this.renderStrokeTextWithLetterSpacing(ctx, line, drawX, lineY, obj.letterSpacing, obj.textAlign);
          } else {
            ctx.strokeText(line, drawX, lineY);
          }
          ctx.restore();
        }

        if (obj.letterSpacing && obj.letterSpacing !== 0) {
          this.renderTextWithLetterSpacing(ctx, line, drawX, lineY, obj.letterSpacing, obj.textAlign);
        } else {
          ctx.fillText(line, drawX, lineY);
        }
      }

      ctx.restore();
    }

    // 4. Apply optional image filters (Brightness, Contrast, Saturation)
    if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
      const filterCanvas = document.createElement('canvas');
      filterCanvas.width = width;
      filterCanvas.height = height;
      const fCtx = filterCanvas.getContext('2d');

      fCtx.filter = `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%) saturate(${filters.saturation || 100}%)`;
      fCtx.drawImage(exportCanvas, 0, 0);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(filterCanvas, 0, 0);
    }

    return exportCanvas;
  }

  renderStrokeTextWithLetterSpacing(ctx, text, x, y, letterSpacing, align) {
    if (!text) return;
    const chars = Array.from(text);
    const totalSpacing = (chars.length - 1) * letterSpacing;
    const baseWidth = ctx.measureText(text).width;
    const fullWidth = baseWidth + totalSpacing;

    let curX = x;
    if (align === 'center') curX = x - fullWidth / 2;
    else if (align === 'right') curX = x - fullWidth;

    for (let i = 0; i < chars.length; i++) {
      ctx.strokeText(chars[i], curX, y);
      curX += ctx.measureText(chars[i]).width + letterSpacing;
    }
  }

  renderTextWithLetterSpacing(ctx, text, x, y, letterSpacing, align) {
    if (!text) return;
    const chars = Array.from(text);
    const totalSpacing = (chars.length - 1) * letterSpacing;
    const baseWidth = ctx.measureText(text).width;
    const fullWidth = baseWidth + totalSpacing;

    let curX = x;
    if (align === 'center') curX = x - fullWidth / 2;
    else if (align === 'right') curX = x - fullWidth;

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], curX, y);
      curX += ctx.measureText(chars[i]).width + letterSpacing;
    }
  }

  /**
   * Export file and trigger direct browser download.
   */
  async downloadImage(options = {}) {
    const {
      format = 'png', // 'png' or 'jpeg'
      quality = 0.95, // 0.70 to 1.00
      originalFilename = 'customized_image',
      filters = {}
    } = options;

    try {
      const canvas = this.renderFullResolutionCanvas(filters);
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : 'png';

      const baseName = ITCUtils.getFileNameWithoutExt(originalFilename);
      const downloadFilename = `${baseName}_edited.${ext}`;

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            ITCUtils.showToast('Browser failed to create image blob', 'error');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 300);

          ITCUtils.showToast(ITCUtils.getTranslation('exportSuccess'), 'success');
        }, mimeType, quality);
      } else {
        // Fallback Data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ITCUtils.showToast(ITCUtils.getTranslation('exportSuccess'), 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      ITCUtils.showToast(`Export failed: ${err.message}`, 'error');
    }
  }
}

window.ExportEngine = ExportEngine;
