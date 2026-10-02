/**
 * Image Text Customizer - Background Repair & Style Estimation Engine
 * Provides intelligent text removal, perimeter color sampling,
 * gradient interpolation, and patch-based inpainting.
 */

class BackgroundRepairEngine {
  constructor() {}

  /**
   * Sample perimeter pixels around a bounding box from a canvas/context.
   * @param {CanvasRenderingContext2D} ctx - Context with original image pixels
   * @param {Object} box - { x, y, width, height }
   * @param {number} padding - expansion margin in pixels
   * @param {number} imgWidth - total image width
   * @param {number} imgHeight - total image height
   */
  samplePerimeter(ctx, box, padding = 4, imgWidth, imgHeight) {
    const rx = Math.max(0, Math.floor(box.x - padding));
    const ry = Math.max(0, Math.floor(box.y - padding));
    const rw = Math.min(imgWidth - rx, Math.ceil(box.width + padding * 2));
    const rh = Math.min(imgHeight - ry, Math.ceil(box.height + padding * 2));

    if (rw <= 0 || rh <= 0) return null;

    // Outer ring bounds (2 to 4 px thick)
    const ringThickness = Math.max(2, Math.min(6, Math.floor(padding)));
    const sampleX = Math.max(0, rx - ringThickness);
    const sampleY = Math.max(0, ry - ringThickness);
    const sampleW = Math.min(imgWidth - sampleX, rw + ringThickness * 2);
    const sampleH = Math.min(imgHeight - sampleY, rh + ringThickness * 2);

    const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
    const data = imgData.data;

    const topPixels = [];
    const bottomPixels = [];
    const leftPixels = [];
    const rightPixels = [];
    const allPerimeterPixels = [];

    for (let py = 0; py < sampleH; py++) {
      for (let px = 0; px < sampleW; px++) {
        // Check if inside inner text box
        const innerX = px + sampleX;
        const innerY = py + sampleY;
        const isInsideInner = (innerX >= rx && innerX < rx + rw && innerY >= ry && innerY < ry + rh);

        if (!isInsideInner) {
          const idx = (py * sampleW + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a > 20) {
            const pixel = { r, g, b, a, x: innerX, y: innerY };
            allPerimeterPixels.push(pixel);

            if (innerY < ry) topPixels.push(pixel);
            else if (innerY >= ry + rh) bottomPixels.push(pixel);

            if (innerX < rx) leftPixels.push(pixel);
            else if (innerX >= rx + rw) rightPixels.push(pixel);
          }
        }
      }
    }

    return {
      rx, ry, rw, rh,
      topPixels,
      bottomPixels,
      leftPixels,
      rightPixels,
      allPerimeterPixels,
      sampleX, sampleY, sampleW, sampleH
    };
  }

  /**
   * Calculate average / median color and standard deviation.
   */
  analyzeColorDistribution(pixels, fallbackAvg = null) {
    if (!pixels || pixels.length === 0) {
      return { avg: fallbackAvg ? { ...fallbackAvg } : { r: 255, g: 255, b: 255 }, variance: 0 };
    }

    let sumR = 0, sumG = 0, sumB = 0;
    for (let i = 0; i < pixels.length; i++) {
      sumR += pixels[i].r;
      sumG += pixels[i].g;
      sumB += pixels[i].b;
    }
    const count = pixels.length;
    const avg = {
      r: Math.round(sumR / count),
      g: Math.round(sumG / count),
      b: Math.round(sumB / count)
    };

    let varSum = 0;
    for (let i = 0; i < pixels.length; i++) {
      const dist = Math.sqrt(
        Math.pow(pixels[i].r - avg.r, 2) +
        Math.pow(pixels[i].g - avg.g, 2) +
        Math.pow(pixels[i].b - avg.b, 2)
      );
      varSum += dist;
    }
    const variance = varSum / count;

    return { avg, variance };
  }

  /**
   * Intelligently repair background at the specified text region.
   * Modifies targetCtx in place.
   */
  repairRegion(targetCtx, sourceCtx, box, options = {}) {
    const {
      method = 'auto',
      padding = 4,
      feather = 2
    } = options;

    const imgWidth = targetCtx.canvas.width;
    const imgHeight = targetCtx.canvas.height;

    const perimeter = this.samplePerimeter(sourceCtx, box, padding, imgWidth, imgHeight);
    if (!perimeter || perimeter.allPerimeterPixels.length === 0) return;

    const { rx, ry, rw, rh, topPixels, bottomPixels, leftPixels, rightPixels, allPerimeterPixels } = perimeter;
    const overallStats = this.analyzeColorDistribution(allPerimeterPixels);

    const topStats = this.analyzeColorDistribution(topPixels, overallStats.avg);
    const bottomStats = this.analyzeColorDistribution(bottomPixels, overallStats.avg);
    const leftStats = this.analyzeColorDistribution(leftPixels, overallStats.avg);
    const rightStats = this.analyzeColorDistribution(rightPixels, overallStats.avg);

    // Determine strategy
    let chosenMethod = method;
    if (chosenMethod === 'auto') {
      const vertDist = ITCUtils.colorDistance(topStats.avg, bottomStats.avg);
      const horizDist = ITCUtils.colorDistance(leftStats.avg, rightStats.avg);

      if (overallStats.variance < 10) {
        chosenMethod = 'solid';
      } else if (vertDist > 18 || horizDist > 18) {
        chosenMethod = 'gradient';
      } else if (overallStats.variance > 25) {
        chosenMethod = 'inpaint';
      } else {
        chosenMethod = 'solid';
      }
    }

    targetCtx.save();

    if (chosenMethod === 'solid') {
      // Median / trimmed average solid fill with soft feathered edge
      targetCtx.fillStyle = `rgb(${overallStats.avg.r}, ${overallStats.avg.g}, ${overallStats.avg.b})`;
      targetCtx.fillRect(rx, ry, rw, rh);
    } else if (chosenMethod === 'gradient') {
      const vertDist = ITCUtils.colorDistance(topStats.avg, bottomStats.avg);
      const horizDist = ITCUtils.colorDistance(leftStats.avg, rightStats.avg);

      let grad;
      if (vertDist >= horizDist) {
        // Vertical gradient
        grad = targetCtx.createLinearGradient(rx, ry, rx, ry + rh);
        grad.addColorStop(0, `rgb(${topStats.avg.r}, ${topStats.avg.g}, ${topStats.avg.b})`);
        grad.addColorStop(1, `rgb(${bottomStats.avg.r}, ${bottomStats.avg.g}, ${bottomStats.avg.b})`);
      } else {
        // Horizontal gradient
        grad = targetCtx.createLinearGradient(rx, ry, rx + rw, ry);
        grad.addColorStop(0, `rgb(${leftStats.avg.r}, ${leftStats.avg.g}, ${leftStats.avg.b})`);
        grad.addColorStop(1, `rgb(${rightStats.avg.r}, ${rightStats.avg.g}, ${rightStats.avg.b})`);
      }
      targetCtx.fillStyle = grad;
      targetCtx.fillRect(rx, ry, rw, rh);
    } else {
      // Patch-based / Bi-harmonic inpainting
      this.inpaintRegion(targetCtx, rx, ry, rw, rh, perimeter);
    }

    // Apply soft edge feathering to eliminate harsh border lines
    if (feather > 0) {
      this.featherEdges(targetCtx, sourceCtx, rx, ry, rw, rh, feather, padding);
    }

    targetCtx.restore();
  }

  /**
   * Bi-harmonic / 4-edge bilinear diffusion inpainting with subtle texture synthesis
   */
  inpaintRegion(ctx, rx, ry, rw, rh, perimeter) {
    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = rw;
    patchCanvas.height = rh;
    const pCtx = patchCanvas.getContext('2d');
    const pImgData = pCtx.createImageData(rw, rh);
    const data = pImgData.data;

    const overall = this.analyzeColorDistribution(perimeter.allPerimeterPixels);
    const top = this.analyzeColorDistribution(perimeter.topPixels, overall.avg).avg;
    const bottom = this.analyzeColorDistribution(perimeter.bottomPixels, overall.avg).avg;
    const left = this.analyzeColorDistribution(perimeter.leftPixels, overall.avg).avg;
    const right = this.analyzeColorDistribution(perimeter.rightPixels, overall.avg).avg;
    const variance = overall.variance;

    // Pseudo-random deterministic noise seed for natural texture
    const noiseScale = Math.min(12, variance * 0.4);

    for (let y = 0; y < rh; y++) {
      const vRatio = rh > 1 ? y / (rh - 1) : 0.5;
      const vR = (1 - vRatio) * top.r + vRatio * bottom.r;
      const vG = (1 - vRatio) * top.g + vRatio * bottom.g;
      const vB = (1 - vRatio) * top.b + vRatio * bottom.b;

      for (let x = 0; x < rw; x++) {
        const hRatio = rw > 1 ? x / (rw - 1) : 0.5;
        const hR = (1 - hRatio) * left.r + hRatio * right.r;
        const hG = (1 - hRatio) * left.g + hRatio * right.g;
        const hB = (1 - hRatio) * left.b + hRatio * right.b;

        // Weight: corners get balanced, centers get bi-directional mix
        let r = (vR + hR) * 0.5;
        let g = (vG + hG) * 0.5;
        let b = (vB + hB) * 0.5;

        // Subtle micro-texture so the fill isn't an unnatural flat patch
        if (noiseScale > 1) {
          const noise = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * noiseScale - (noiseScale / 2);
          r = ITCUtils.clamp(r + noise, 0, 255);
          g = ITCUtils.clamp(g + noise, 0, 255);
          b = ITCUtils.clamp(b + noise, 0, 255);
        }

        const idx = (y * rw + x) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = 255;
      }
    }

    pCtx.putImageData(pImgData, 0, 0);
    ctx.drawImage(patchCanvas, rx, ry);
  }

  /**
   * Feather boundary edges so repaired patch seamlessly merges with original background
   */
  featherEdges(targetCtx, sourceCtx, rx, ry, rw, rh, featherSize, padding = 4) {
    const maxSafeFeather = Math.max(0, padding - 1);
    const f = Math.min(featherSize, maxSafeFeather, Math.floor(Math.min(rw, rh) / 4));
    if (f <= 0) return;

    // Grab repaired patch from targetCtx
    const repairedData = targetCtx.getImageData(rx, ry, rw, rh);
    const sourceData = sourceCtx.getImageData(rx, ry, rw, rh);
    const rep = repairedData.data;
    const src = sourceData.data;

    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        // Distance to closest edge
        const distLeft = x;
        const distRight = rw - 1 - x;
        const distTop = y;
        const distBottom = rh - 1 - y;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist < f) {
          // Alpha blending factor: 0 at edge (original image), 1 inside patch
          const alpha = minDist / f;
          const idx = (y * rw + x) * 4;

          rep[idx] = Math.round(src[idx] * (1 - alpha) + rep[idx] * alpha);
          rep[idx + 1] = Math.round(src[idx + 1] * (1 - alpha) + rep[idx + 1] * alpha);
          rep[idx + 2] = Math.round(src[idx + 2] * (1 - alpha) + rep[idx + 2] * alpha);
        }
      }
    }

    targetCtx.putImageData(repairedData, rx, ry);
  }

  /**
   * Style estimation: inspects original text bounding box to estimate
   * dominant text color, background color, and font scale.
   */
  estimateStyle(ctx, box) {
    const imgWidth = ctx.canvas.width;
    const imgHeight = ctx.canvas.height;

    // Sample perimeter to get background color
    const perimeter = this.samplePerimeter(ctx, box, 4, imgWidth, imgHeight);
    const bgAvg = perimeter ? this.analyzeColorDistribution(perimeter.allPerimeterPixels).avg : { r: 255, g: 255, b: 255 };

    // Inspect pixels inside the bounding box
    const bx = Math.max(0, Math.floor(box.x));
    const by = Math.max(0, Math.floor(box.y));
    const bw = Math.min(imgWidth - bx, Math.ceil(box.width));
    const bh = Math.min(imgHeight - by, Math.ceil(box.height));

    if (bw <= 0 || bh <= 0) {
      return {
        textColor: '#000000',
        bgColor: ITCUtils.rgbToHex(bgAvg.r, bgAvg.g, bgAvg.b),
        estimatedFontSize: Math.max(14, Math.round(bh * 0.75)),
        fontWeight: 'bold'
      };
    }

    const boxData = ctx.getImageData(bx, by, bw, bh).data;
    const textPixels = [];

    // Find pixels that contrast significantly with background (likely text glyphs)
    for (let i = 0; i < boxData.length; i += 4) {
      const r = boxData[i];
      const g = boxData[i + 1];
      const b = boxData[i + 2];
      const dist = ITCUtils.colorDistance({ r, g, b }, bgAvg);

      if (dist > 35) {
        textPixels.push({ r, g, b, dist });
      }
    }

    let textAvg;
    if (textPixels.length > 5) {
      // Sort by contrast distance from background descending
      // Core text glyph pixels have the highest distance from background
      textPixels.sort((a, b) => b.dist - a.dist);
      const coreCount = Math.max(3, Math.floor(textPixels.length * 0.45));
      let sumR = 0, sumG = 0, sumB = 0;
      for (let i = 0; i < coreCount; i++) {
        sumR += textPixels[i].r;
        sumG += textPixels[i].g;
        sumB += textPixels[i].b;
      }
      textAvg = {
        r: Math.round(sumR / coreCount),
        g: Math.round(sumG / coreCount),
        b: Math.round(sumB / coreCount)
      };
    } else {
      // Fallback: if bg is dark, make text white, else black
      const bgLum = ITCUtils.getLuminance(bgAvg.r, bgAvg.g, bgAvg.b);
      textAvg = bgLum < 128 ? { r: 255, g: 255, b: 255 } : { r: 20, g: 20, b: 20 };
    }

    // Weight estimation based on text pixel density
    const fillDensity = textPixels.length / (bw * bh);
    let fontWeight = 'bold';
    if (fillDensity < 0.20) {
      fontWeight = 'normal';
    } else if (fillDensity < 0.30) {
      fontWeight = '500';
    } else {
      fontWeight = 'bold';
    }

    let fontFamily = 'Inter';
    if (/[\u0B80-\u0BFF]/.test(box.text || '')) {
      fontFamily = 'Noto Sans Tamil';
    }

    return {
      textColor: ITCUtils.rgbToHex(textAvg.r, textAvg.g, textAvg.b),
      bgColor: ITCUtils.rgbToHex(bgAvg.r, bgAvg.g, bgAvg.b),
      estimatedFontSize: Math.max(14, Math.round(bh * 0.95)),
      fontWeight,
      fontFamily
    };
  }
}

window.BackgroundRepairEngine = BackgroundRepairEngine;
