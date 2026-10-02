/**
 * Image Text Customizer - Canvas Editor
 * High-performance HTML5 Canvas rendering engine with zoom, pan,
 * interactive text objects, resize/rotate handles, split preview, and OCR overlay.
 */

class CanvasEditor {
  constructor(canvasElement, containerElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.container = containerElement;

    // Offscreen buffers
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d');

    this.repairedCanvas = document.createElement('canvas');
    this.repairedCtx = this.repairedCanvas.getContext('2d');
    this.isRepairedClean = false;

    // Engines
    this.repairEngine = new BackgroundRepairEngine();

    // Image state
    this.image = null;
    this.imageWidth = 0;
    this.imageHeight = 0;

    // Viewport transform
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Active Tool: 'select' | 'text' | 'pan'
    this.activeTool = 'select';

    // Text Objects & OCR
    this.textObjects = [];
    this.selectedId = null;
    this.ocrRegions = [];
    this.hoveredOCRRegion = null;
    this.showOCROverlay = true;

    // Split Preview
    this.isSplitView = false;
    this.splitPosition = 0.5; // 0.0 to 1.0
    this.isHoldingBefore = false;

    // Interaction state
    this.interactionMode = 'idle'; // 'idle' | 'move' | 'resize' | 'rotate' | 'pan' | 'split'
    this.activeHandle = null; // 'tl' | 'tr' | 'br' | 'bl' | 'rot'
    this.dragStart = { x: 0, y: 0 };
    this.dragOriginObject = null;
    this.isSpacePressed = false;

    // Callbacks
    this.onSelectCallback = null;
    this.onObjectsChangeCallback = null;
    this.onHistoryPushCallback = null;
    this.onStatusChangeCallback = null;
    this.onOpenQuickEditCallback = null;

    this.initCanvasSize();
    this.bindEvents();
  }

  initCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = Math.max(300, Math.floor(rect.width));
    this.canvas.height = Math.max(300, Math.floor(rect.height));
  }

  loadImage(imgElement) {
    this.image = imgElement;
    this.imageWidth = imgElement.naturalWidth || imgElement.width;
    this.imageHeight = imgElement.naturalHeight || imgElement.height;

    // Initialize source buffer
    this.sourceCanvas.width = this.imageWidth;
    this.sourceCanvas.height = this.imageHeight;
    this.sourceCtx.clearRect(0, 0, this.imageWidth, this.imageHeight);
    this.sourceCtx.drawImage(this.image, 0, 0);

    // Initialize repaired buffer
    this.repairedCanvas.width = this.imageWidth;
    this.repairedCanvas.height = this.imageHeight;
    this.invalidateBackground();

    this.textObjects = [];
    this.selectedId = null;
    this.ocrRegions = [];
    this.hoveredOCRRegion = null;

    this.fitToScreen();
    this.render();
  }

  fitToScreen() {
    if (!this.image) return;
    this.initCanvasSize();

    const padding = 40;
    const availW = this.canvas.width - padding * 2;
    const availH = this.canvas.height - padding * 2;

    const scaleW = availW / this.imageWidth;
    const scaleH = availH / this.imageHeight;
    this.zoom = Math.min(scaleW, scaleH, 1.0);

    // Center in canvas
    this.panX = (this.canvas.width - this.imageWidth * this.zoom) / 2;
    this.panY = (this.canvas.height - this.imageHeight * this.zoom) / 2;

    this.render();
    this.notifyStatus();
  }

  setZoom(zoomFactor, centerX = null, centerY = null) {
    if (!this.image) return;
    const oldZoom = this.zoom;
    const newZoom = ITCUtils.clamp(zoomFactor, 0.08, 10.0);

    const cx = centerX !== null ? centerX : this.canvas.width / 2;
    const cy = centerY !== null ? centerY : this.canvas.height / 2;

    // Keep point under cursor stable
    this.panX = cx - ((cx - this.panX) / oldZoom) * newZoom;
    this.panY = cy - ((cy - this.panY) / oldZoom) * newZoom;
    this.zoom = newZoom;

    this.render();
    this.notifyStatus();
  }

  screenToImage(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  }

  imageToScreen(ix, iy) {
    return {
      x: ix * this.zoom + this.panX,
      y: iy * this.zoom + this.panY
    };
  }

  invalidateBackground() {
    this.isRepairedClean = false;
  }

  /**
   * Rebuild background repair cache
   */
  updateRepairedBackground() {
    if (this.isRepairedClean || !this.image) return;

    this.repairedCtx.clearRect(0, 0, this.imageWidth, this.imageHeight);
    this.repairedCtx.drawImage(this.sourceCanvas, 0, 0);

    // Repair all active text regions marked for background repair
    for (const obj of this.textObjects) {
      if (obj.visible && obj.repairBackground) {
        const box = obj.originalBox || {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height
        };

        this.repairEngine.repairRegion(
          this.repairedCtx,
          this.sourceCtx,
          box,
          {
            method: obj.repairMethod || 'auto',
            padding: obj.repairPadding !== undefined ? obj.repairPadding : 4,
            feather: 2
          }
        );
      }
    }

    this.isRepairedClean = true;
  }

  /**
   * Main Render Pipeline
   */
  render() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.image) return;

    ctx.save();

    // Draw dark workspace checkered canvas backdrop
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transformation
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // 1. Draw Background Image (Original or Repaired)
    if (this.isHoldingBefore) {
      // Temporarily view untouched original
      ctx.drawImage(this.sourceCanvas, 0, 0);
    } else if (this.isSplitView) {
      this.renderSplitView(ctx);
    } else {
      this.updateRepairedBackground();
      ctx.drawImage(this.repairedCanvas, 0, 0);
    }

    // 2. Draw Text Objects (unless viewing Before)
    if (!this.isHoldingBefore) {
      this.renderTextObjects(ctx);
    }

    // 3. Draw OCR Overlays
    if (this.showOCROverlay && this.ocrRegions.length > 0 && !this.isHoldingBefore) {
      this.renderOCROverlay(ctx);
    }

    ctx.restore();

    // 4. Draw Split Line if in Split Mode (in screen space)
    if (this.isSplitView && !this.isHoldingBefore) {
      this.renderSplitDivider();
    }

    // 5. Update floating toolbar position
    this.updateToolbarPosition();
  }

  renderSplitView(ctx) {
    const splitX = this.imageWidth * this.splitPosition;

    // Draw Before (original) on left side
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, this.imageHeight);
    ctx.clip();
    ctx.drawImage(this.sourceCanvas, 0, 0);
    ctx.restore();

    // Draw After (repaired) on right side
    this.updateRepairedBackground();
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, this.imageWidth - splitX, this.imageHeight);
    ctx.clip();
    ctx.drawImage(this.repairedCanvas, 0, 0);
    ctx.restore();
  }

  renderSplitDivider() {
    const splitImgX = this.imageWidth * this.splitPosition;
    const screenSplitX = splitImgX * this.zoom + this.panX;
    const startY = Math.max(0, this.panY);
    const endY = Math.min(this.canvas.height, this.imageHeight * this.zoom + this.panY);

    const ctx = this.ctx;
    ctx.save();

    // Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(screenSplitX, startY);
    ctx.lineTo(screenSplitX, endY);
    ctx.stroke();

    // Center circular badge
    const midY = (startY + endY) / 2;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(screenSplitX, midY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrows
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◄►', screenSplitX, midY);

    ctx.restore();
  }

  renderTextObjects(ctx) {
    for (const obj of this.textObjects) {
      if (!obj.visible) continue;

      // In split view, clip replacement text if it falls in the "Before" (left) side
      if (this.isSplitView) {
        const splitX = this.imageWidth * this.splitPosition;
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, this.imageWidth - splitX, this.imageHeight);
        ctx.clip();
      }

      ctx.save();
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
      ctx.rotate((obj.rotation || 0) * Math.PI / 180);
      ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1.0;

      // Calculate layout & metrics
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
      let startY = -totalTextHeight / 2 + lineHeightPx / 2;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (obj.letterSpacing && obj.letterSpacing !== 0) {
          this.renderTextWithLetterSpacing(ctx, line, drawX, startY + i * lineHeightPx, obj.letterSpacing, obj.textAlign);
        } else {
          ctx.fillText(line, drawX, startY + i * lineHeightPx);
        }
      }

      ctx.restore();

      if (this.isSplitView) {
        ctx.restore();
      }
    }

    // Draw Selection Box & Handles for the active object
    const selected = this.getSelectedObject();
    if (selected && selected.visible) {
      this.renderSelectionOutline(ctx, selected);
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

  renderSelectionOutline(ctx, obj) {
    ctx.save();
    ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
    ctx.rotate((obj.rotation || 0) * Math.PI / 180);

    const halfW = obj.width / 2;
    const halfH = obj.height / 2;

    // Selection border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8 / this.zoom;
    ctx.setLineDash([4 / this.zoom, 3 / this.zoom]);
    ctx.strokeRect(-halfW, -halfH, obj.width, obj.height);
    ctx.setLineDash([]);

    // Corner Handles
    const handleSize = 9 / this.zoom;
    const halfHandle = handleSize / 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2 / this.zoom;

    const corners = [
      { x: -halfW, y: -halfH }, // TL
      { x: halfW, y: -halfH },  // TR
      { x: halfW, y: halfH },   // BR
      { x: -halfW, y: halfH }   // BL
    ];

    for (const c of corners) {
      ctx.fillRect(c.x - halfHandle, c.y - halfHandle, handleSize, handleSize);
      ctx.strokeRect(c.x - halfHandle, c.y - halfHandle, handleSize, handleSize);
    }

    // Rotation Handle (top)
    const rotDist = 24 / this.zoom;
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(0, -halfH - rotDist);
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -halfH - rotDist, handleSize / 1.7, 0, Math.PI * 2);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderOCROverlay(ctx) {
    for (const region of this.ocrRegions) {
      const isHovered = this.hoveredOCRRegion && this.hoveredOCRRegion.id === region.id;
      const hasAssociatedText = this.textObjects.some(o => o.originalBox && o.originalBox.id === region.id);

      // Don't show bounding box if user already edited/customized it
      if (hasAssociatedText) continue;

      ctx.save();
      ctx.lineWidth = (isHovered ? 2 : 1) / this.zoom;
      ctx.strokeStyle = isHovered ? '#10b981' : 'rgba(56, 189, 248, 0.45)';
      ctx.fillStyle = isHovered ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.08)';

      ctx.fillRect(region.x, region.y, region.width, region.height);
      ctx.strokeRect(region.x, region.y, region.width, region.height);

      if (isHovered) {
        // Draw hover pill badge above region
        const badgeText = `"${region.text}" (${region.confidence}%)`;
        ctx.font = `bold ${Math.max(11, 12 / this.zoom)}px sans-serif`;
        const textW = ctx.measureText(badgeText).width;
        const pad = 6 / this.zoom;
        const badgeH = 20 / this.zoom;

        const badgeX = region.x;
        const badgeY = Math.max(0, region.y - badgeH - 4 / this.zoom);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, textW + pad * 2, badgeH, 4 / this.zoom);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + pad, badgeY + badgeH / 2);
      }

      ctx.restore();
    }
  }

  updateToolbarPosition() {
    const selected = this.getSelectedObject();
    if (!selected || this.interactionMode !== 'idle') {
      if (this.onSelectCallback) this.onSelectCallback(selected, null);
      return;
    }

    const screenTopCenter = this.imageToScreen(selected.x + selected.width / 2, selected.y);
    if (this.onSelectCallback) {
      this.onSelectCallback(selected, screenTopCenter);
    }
  }

  getSelectedObject() {
    return this.textObjects.find(o => o.id === this.selectedId) || null;
  }

  /**
   * Hit Testing
   */
  hitTest(screenX, screenY) {
    if (!this.image) return null;
    const imgPt = this.screenToImage(screenX, screenY);

    // 1. Check selected object's resize and rotate handles first
    const selected = this.getSelectedObject();
    if (selected) {
      const handleHit = this.hitTestHandles(selected, imgPt.x, imgPt.y);
      if (handleHit) return { type: 'handle', handle: handleHit, object: selected };
    }

    // 2. Check text objects (top to bottom order)
    for (let i = this.textObjects.length - 1; i >= 0; i--) {
      const obj = this.textObjects[i];
      if (!obj.visible) continue;
      if (ITCUtils.pointInRotatedRect(imgPt.x, imgPt.y, obj.x, obj.y, obj.width, obj.height, (obj.rotation || 0) * Math.PI / 180)) {
        return { type: 'object', object: obj };
      }
    }

    // 3. Check OCR regions
    if (this.showOCROverlay) {
      for (const region of this.ocrRegions) {
        const hasAssociated = this.textObjects.some(o => o.originalBox && o.originalBox.id === region.id);
        if (hasAssociated) continue;

        if (imgPt.x >= region.x && imgPt.x <= region.x + region.width &&
            imgPt.y >= region.y && imgPt.y <= region.y + region.height) {
          return { type: 'ocr', region: region };
        }
      }
    }

    return null;
  }

  hitTestHandles(obj, imgX, imgY) {
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const unrotated = ITCUtils.rotatePoint(imgX, imgY, cx, cy, -(obj.rotation || 0) * Math.PI / 180);

    const halfW = obj.width / 2;
    const halfH = obj.height / 2;
    const handleThreshold = 14 / this.zoom;

    // Rotate handle
    const rotY = -halfH - 24 / this.zoom;
    if (Math.abs(unrotated.x - cx) <= handleThreshold && Math.abs(unrotated.y - (cy + rotY)) <= handleThreshold) {
      return 'rot';
    }

    // Corners
    if (Math.abs(unrotated.x - (cx - halfW)) <= handleThreshold && Math.abs(unrotated.y - (cy - halfH)) <= handleThreshold) return 'tl';
    if (Math.abs(unrotated.x - (cx + halfW)) <= handleThreshold && Math.abs(unrotated.y - (cy - halfH)) <= handleThreshold) return 'tr';
    if (Math.abs(unrotated.x - (cx + halfW)) <= handleThreshold && Math.abs(unrotated.y - (cy + halfH)) <= handleThreshold) return 'br';
    if (Math.abs(unrotated.x - (cx - halfW)) <= handleThreshold && Math.abs(unrotated.y - (cy + halfH)) <= handleThreshold) return 'bl';

    return null;
  }

  hitTestSplitLine(screenX) {
    if (!this.isSplitView) return false;
    const splitImgX = this.imageWidth * this.splitPosition;
    const screenSplitX = splitImgX * this.zoom + this.panX;
    return Math.abs(screenX - screenSplitX) <= 12;
  }

  /**
   * Events Handling
   */
  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Keyboard shortcuts for panning
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space' && !this.isSpacePressed) {
        this.isSpacePressed = true;
        this.canvas.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.canvas.style.cursor = 'default';
      }
    });
  }

  onDoubleClick(e) {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const hit = this.hitTest(sx, sy);

    if (hit && hit.type === 'ocr') {
      const textObj = this.convertOCRToEditableText(hit.region);
      this.selectObject(textObj.id);
      if (this.onOpenQuickEditCallback) {
        this.onOpenQuickEditCallback(textObj);
      }
    } else if (hit && (hit.type === 'object' || (hit.type === 'handle' && hit.object))) {
      const targetObj = hit.type === 'object' ? hit.object : hit.object;
      this.selectObject(targetObj.id);
      if (this.onOpenQuickEditCallback) {
        this.onOpenQuickEditCallback(targetObj);
      }
    }
  }

  onMouseDown(e) {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Check if middle click or spacebar down -> Pan
    if (e.button === 1 || this.isSpacePressed || this.activeTool === 'pan') {
      this.interactionMode = 'pan';
      this.dragStart = { x: sx, y: sy };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Check Split Line Drag
    if (this.hitTestSplitLine(sx)) {
      this.interactionMode = 'split';
      this.canvas.style.cursor = 'ew-resize';
      return;
    }

    const hit = this.hitTest(sx, sy);

    if (this.activeTool === 'text') {
      // Add Text on click
      const imgPt = this.screenToImage(sx, sy);
      this.addCustomText(imgPt.x, imgPt.y);
      this.activeTool = 'select';
      return;
    }

    if (!hit) {
      // Clicked background -> deselect
      this.selectObject(null);
      this.render();
      return;
    }

    if (hit.type === 'handle') {
      this.interactionMode = hit.handle === 'rot' ? 'rotate' : 'resize';
      this.activeHandle = hit.handle;
      this.dragStart = { x: sx, y: sy };
      this.dragOriginObject = JSON.parse(JSON.stringify(hit.object));
    } else if (hit.type === 'object') {
      this.selectObject(hit.object.id);
      this.interactionMode = 'move';
      this.dragStart = { x: sx, y: sy };
      this.dragOriginObject = JSON.parse(JSON.stringify(hit.object));
      this.canvas.style.cursor = 'move';
    } else if (hit.type === 'ocr') {
      // Clicked OCR region -> convert to editable TextObject!
      const newObj = this.convertOCRToEditableText(hit.region);
      this.selectObject(newObj.id);
      this.interactionMode = 'move';
      this.dragStart = { x: sx, y: sy };
      this.dragOriginObject = JSON.parse(JSON.stringify(newObj));
      this.canvas.style.cursor = 'move';
    }

    this.render();
  }

  onMouseMove(e) {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.interactionMode === 'idle') {
      this.updateCursorAndHover(sx, sy);
      return;
    }

    const dx = (sx - this.dragStart.x) / this.zoom;
    const dy = (sy - this.dragStart.y) / this.zoom;

    if (this.interactionMode === 'pan') {
      this.panX += (sx - this.dragStart.x);
      this.panY += (sy - this.dragStart.y);
      this.dragStart = { x: sx, y: sy };
      this.render();
    } else if (this.interactionMode === 'split') {
      const imgX = (sx - this.panX) / this.zoom;
      this.splitPosition = ITCUtils.clamp(imgX / this.imageWidth, 0.05, 0.95);
      this.render();
    } else if (this.interactionMode === 'move') {
      const selected = this.getSelectedObject();
      if (selected && this.dragOriginObject) {
        selected.x = Math.round(this.dragOriginObject.x + dx);
        selected.y = Math.round(this.dragOriginObject.y + dy);
        this.render();
      }
    } else if (this.interactionMode === 'resize') {
      this.handleResizeDrag(dx, dy);
    } else if (this.interactionMode === 'rotate') {
      this.handleRotateDrag(sx, sy);
    }
  }

  onMouseUp(e) {
    if (this.interactionMode !== 'idle') {
      const wasTransforming = ['move', 'resize', 'rotate'].includes(this.interactionMode);
      this.interactionMode = 'idle';
      this.activeHandle = null;
      this.dragOriginObject = null;
      this.canvas.style.cursor = 'default';

      if (wasTransforming) {
        this.saveHistoryState('Transform Object');
      }

      this.render();
    }
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const zoomStep = e.deltaY < 0 ? 1.15 : 0.87;
    this.setZoom(this.zoom * zoomStep, sx, sy);
  }

  updateCursorAndHover(sx, sy) {
    if (this.hitTestSplitLine(sx)) {
      this.canvas.style.cursor = 'ew-resize';
      return;
    }

    const hit = this.hitTest(sx, sy);

    let needsRender = false;
    if (hit && hit.type === 'ocr') {
      if (this.hoveredOCRRegion !== hit.region) {
        this.hoveredOCRRegion = hit.region;
        needsRender = true;
      }
    } else {
      if (this.hoveredOCRRegion !== null) {
        this.hoveredOCRRegion = null;
        needsRender = true;
      }
    }

    if (needsRender) this.render();

    if (!hit) {
      this.canvas.style.cursor = this.isSpacePressed || this.activeTool === 'pan' ? 'grab' : 'default';
      return;
    }

    if (hit.type === 'handle') {
      if (hit.handle === 'rot') this.canvas.style.cursor = 'grab';
      else if (hit.handle === 'tl' || hit.handle === 'br') this.canvas.style.cursor = 'nwse-resize';
      else this.canvas.style.cursor = 'nesw-resize';
    } else if (hit.type === 'object') {
      this.canvas.style.cursor = 'move';
    } else if (hit.type === 'ocr') {
      this.canvas.style.cursor = 'pointer';
    }
  }

  handleResizeDrag(dx, dy) {
    const selected = this.getSelectedObject();
    if (!selected || !this.dragOriginObject) return;

    const orig = this.dragOriginObject;
    let newX = orig.x;
    let newY = orig.y;
    let newW = orig.width;
    let newH = orig.height;

    const handle = this.activeHandle;

    if (handle.includes('r')) newW = Math.max(20, orig.width + dx);
    if (handle.includes('b')) newH = Math.max(16, orig.height + dy);
    if (handle.includes('l')) {
      const allowedW = Math.max(20, orig.width - dx);
      newX = orig.x + (orig.width - allowedW);
      newW = allowedW;
    }
    if (handle.includes('t')) {
      const allowedH = Math.max(16, orig.height - dy);
      newY = orig.y + (orig.height - allowedH);
      newH = allowedH;
    }

    selected.x = Math.round(newX);
    selected.y = Math.round(newY);
    selected.width = Math.round(newW);
    selected.height = Math.round(newH);

    // Automatically scale font size proportionally if height changes
    if (orig.height > 0) {
      const scale = newH / orig.height;
      selected.fontSize = Math.max(10, Math.round(orig.fontSize * scale));
    }

    this.render();
  }

  handleRotateDrag(sx, sy) {
    const selected = this.getSelectedObject();
    if (!selected || !this.dragOriginObject) return;

    const centerScreen = this.imageToScreen(
      this.dragOriginObject.x + this.dragOriginObject.width / 2,
      this.dragOriginObject.y + this.dragOriginObject.height / 2
    );

    const rad = Math.atan2(sy - centerScreen.y, sx - centerScreen.x);
    let deg = Math.round(rad * (180 / Math.PI)) + 90;
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;

    selected.rotation = deg;
    this.render();
  }

  /**
   * High-Level Object Operations
   */
  selectObject(id) {
    this.selectedId = id;
    const selected = this.getSelectedObject();
    if (this.onSelectCallback) {
      const screenTop = selected ? this.imageToScreen(selected.x + selected.width / 2, selected.y) : null;
      this.onSelectCallback(selected, screenTop);
    }
  }

  estimateExactFontSize(text, targetHeight, fontFamily, fontWeight) {
    if (!text || targetHeight <= 0) return Math.max(14, Math.round(targetHeight));

    this.ctx.save();
    const testSize = 100;
    this.ctx.font = `${fontWeight || 'bold'} ${testSize}px "${fontFamily || 'Inter'}", sans-serif`;
    const metrics = this.ctx.measureText(text);
    this.ctx.restore();

    let glyphHeight = testSize * 0.72; // default fallback
    if (metrics.actualBoundingBoxAscent !== undefined && metrics.actualBoundingBoxDescent !== undefined) {
      const h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      if (h > 8) glyphHeight = h;
    }

    // Exact scale factor to match original visual pixel height
    const exactFontSize = Math.round((targetHeight / glyphHeight) * testSize);
    return Math.max(12, Math.min(260, exactFontSize));
  }

  estimateAlignment(ocrRegion, imgWidth) {
    const boxCenterX = ocrRegion.x + ocrRegion.width / 2;
    const imgCenterX = imgWidth / 2;
    const centerOffset = Math.abs(boxCenterX - imgCenterX);

    // If within 8% of center, it's center-aligned
    if (centerOffset < imgWidth * 0.08) {
      return 'center';
    }
    // If start is within 25% from left
    if (ocrRegion.x < imgWidth * 0.25) {
      return 'left';
    }
    // If end is near right edge
    if ((ocrRegion.x + ocrRegion.width) > imgWidth * 0.75) {
      return 'right';
    }
    return 'left';
  }

  fitObjectToText(obj) {
    if (!obj || !obj.text) return;
    const lines = String(obj.text).split('\n');
    const fontSize = obj.fontSize || 32;
    const lineHeightPx = fontSize * (obj.lineHeight || 1.2);
    const fontStyle = obj.fontStyle === 'italic' ? 'italic' : 'normal';
    const fontWeight = obj.fontWeight || 'normal';

    this.ctx.save();
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${obj.fontFamily || 'Arial'}", sans-serif`;

    let maxW = 0;
    for (const line of lines) {
      let w = this.ctx.measureText(line).width;
      if (obj.letterSpacing && obj.letterSpacing !== 0) {
        w += Math.max(0, Array.from(line).length - 1) * obj.letterSpacing;
      }
      if (w > maxW) maxW = w;
    }
    this.ctx.restore();

    const padding = 16;
    const newW = Math.max(40, Math.round(maxW + padding));
    const newH = Math.max(20, Math.round(lines.length * lineHeightPx));

    // Anchor based on alignment so text stays positioned naturally
    if (obj.textAlign === 'center') {
      const cx = obj.x + obj.width / 2;
      obj.width = newW;
      obj.x = Math.round(cx - newW / 2);
    } else if (obj.textAlign === 'right') {
      const rightX = obj.x + obj.width;
      obj.width = newW;
      obj.x = Math.round(rightX - newW);
    } else {
      // Left aligned: left position stays fixed
      obj.width = newW;
    }

    const cy = obj.y + obj.height / 2;
    obj.height = newH;
    obj.y = Math.round(cy - newH / 2);
  }

  addCustomText(imgX, imgY) {
    const newId = `txt-${Date.now()}`;
    const defaultText = ITCUtils.getTranslation('textAdded') || 'Custom Text';

    const textObj = {
      id: newId,
      text: defaultText,
      x: Math.round(imgX - 90),
      y: Math.round(imgY - 24),
      width: 180,
      height: 48,
      rotation: 0,
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: 'bold',
      fontStyle: 'normal',
      fillColor: '#ffffff',
      opacity: 1.0,
      letterSpacing: 0,
      lineHeight: 1.2,
      textAlign: 'center',
      repairBackground: false,
      repairMethod: 'auto',
      repairPadding: 4,
      originalBox: null,
      isOCR: false,
      visible: true
    };

    this.fitObjectToText(textObj);
    this.textObjects.push(textObj);
    this.selectObject(newId);
    this.saveHistoryState('Add Custom Text');
    this.notifyObjectsChange();
    this.render();

    if (this.onOpenQuickEditCallback) {
      this.onOpenQuickEditCallback(textObj);
    }
    return textObj;
  }

  convertOCRToEditableText(ocrRegion) {
    // Estimate style from underlying original image
    const style = this.repairEngine.estimateStyle(this.sourceCtx, ocrRegion);

    const isTamil = /[\u0B80-\u0BFF]/.test(ocrRegion.text);
    const fontFamily = isTamil ? 'Noto Sans Tamil' : style.fontFamily;

    // Calculate exact font size so replacement glyphs match exact visual height
    const exactFontSize = this.estimateExactFontSize(
      ocrRegion.text,
      ocrRegion.height,
      fontFamily,
      style.fontWeight
    );

    const textAlign = this.estimateAlignment(ocrRegion, this.imageWidth);

    const textObj = {
      id: `text-${ocrRegion.id}`,
      text: ocrRegion.text,
      x: ocrRegion.x,
      y: ocrRegion.y,
      width: ocrRegion.width,
      height: ocrRegion.height,
      rotation: 0,
      fontFamily: fontFamily,
      fontSize: exactFontSize,
      fontWeight: style.fontWeight,
      fontStyle: 'normal',
      fillColor: style.textColor,
      opacity: 1.0,
      letterSpacing: 0,
      lineHeight: 1.15,
      textAlign: textAlign,
      repairBackground: true, // Erases original text!
      repairMethod: 'auto',
      repairPadding: 4,
      originalBox: { ...ocrRegion },
      isOCR: true,
      visible: true
    };

    this.textObjects.push(textObj);
    this.selectObject(textObj.id);
    this.invalidateBackground();
    this.saveHistoryState(`Edit Detected: "${ocrRegion.text}"`);
    this.notifyObjectsChange();
    this.render();
    return textObj;
  }

  duplicateObject(textObj) {
    const copy = JSON.parse(JSON.stringify(textObj));
    copy.id = `txt-${Date.now()}`;
    copy.x += 20;
    copy.y += 20;
    copy.originalBox = null;
    copy.isOCR = false;

    this.textObjects.push(copy);
    this.selectObject(copy.id);
    this.saveHistoryState('Duplicate Text');
    this.notifyObjectsChange();
    this.render();
  }

  deleteObject(id) {
    const idx = this.textObjects.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.textObjects.splice(idx, 1);
      this.selectObject(null);
      this.invalidateBackground();
      this.saveHistoryState('Delete Text');
      this.notifyObjectsChange();
      this.render();
    }
  }

  reorderObject(id, direction) {
    const idx = this.textObjects.findIndex(o => o.id === id);
    if (idx === -1) return;

    if (direction === 'up' && idx < this.textObjects.length - 1) {
      const temp = this.textObjects[idx];
      this.textObjects[idx] = this.textObjects[idx + 1];
      this.textObjects[idx + 1] = temp;
    } else if (direction === 'down' && idx > 0) {
      const temp = this.textObjects[idx];
      this.textObjects[idx] = this.textObjects[idx - 1];
      this.textObjects[idx - 1] = temp;
    }

    this.saveHistoryState('Reorder Layer');
    this.notifyObjectsChange();
    this.render();
  }

  toggleObjectVisibility(id) {
    const obj = this.textObjects.find(o => o.id === id);
    if (obj) {
      obj.visible = !obj.visible;
      this.invalidateBackground();
      this.render();
      this.notifyObjectsChange();
    }
  }

  setOCRRegions(regions) {
    this.ocrRegions = regions;
    this.showOCROverlay = true;
    this.render();
    this.notifyStatus();
  }

  saveHistoryState(actionName) {
    if (this.onHistoryPushCallback) {
      this.onHistoryPushCallback(this.textObjects, actionName);
    }
  }

  restoreState(state) {
    this.textObjects = JSON.parse(JSON.stringify(state));
    this.invalidateBackground();
    this.render();
    this.notifyObjectsChange();
  }

  notifyObjectsChange() {
    if (this.onObjectsChangeCallback) {
      this.onObjectsChangeCallback(this.textObjects, this.selectedId);
    }
  }

  notifyStatus() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({
        width: this.imageWidth,
        height: this.imageHeight,
        zoom: Math.round(this.zoom * 100),
        ocrCount: this.ocrRegions.length
      });
    }
  }
}

window.CanvasEditor = CanvasEditor;
