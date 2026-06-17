import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { floodFillRemoveBg } from './removeBg.js';
import { renderWithBackground } from './background.js';
import { showToast } from '../ui/toast.js';
import { renderThumbnails } from './fileHandler.js';

function cloneHistoryEntry(entry) {
  return {
    width: entry.width,
    height: entry.height,
    imageData: new ImageData(
      new Uint8ClampedArray(entry.imageData.data),
      entry.imageData.width,
      entry.imageData.height
    ),
    bgType: entry.bgType,
    bgColor: entry.bgColor,
    gradientStart: entry.gradientStart,
    gradientEnd: entry.gradientEnd,
    gradientAngle: entry.gradientAngle
  };
}

function createHistoryEntry(imageData, width, height, bgType, bgColor, gradientStart, gradientEnd, gradientAngle) {
  return {
    width,
    height,
    imageData: new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    ),
    bgType,
    bgColor,
    gradientStart,
    gradientEnd,
    gradientAngle
  };
}

function processImageSync(imgObj, processFn) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCanvas.width = imgObj.width;
  tempCanvas.height = imgObj.height;

  const currentEntry = imgObj.history[imgObj.historyIndex];
  tempCtx.putImageData(currentEntry.imageData, 0, 0);

  const origCtx = state.ctx;
  const origCanvas = state.canvas;
  state.ctx = tempCtx;
  state.canvas = tempCanvas;

  try {
    processFn(tempCanvas, tempCtx);
  } finally {
    state.ctx = origCtx;
    state.canvas = origCanvas;
  }

  const resultImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  return {
    imageData: resultImageData,
    width: tempCanvas.width,
    height: tempCanvas.height
  };
}

function regenerateThumbnail(imageData, width, height) {
  const thumbCanvas = document.createElement('canvas');
  const thumbCtx = thumbCanvas.getContext('2d');
  const thumbSize = 80;
  const thumbRatio = Math.min(thumbSize / width, thumbSize / height);
  const thumbW = Math.round(width * thumbRatio);
  const thumbH = Math.round(height * thumbRatio);
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;

  const tempCanvas2 = document.createElement('canvas');
  const tempCtx2 = tempCanvas2.getContext('2d');
  tempCanvas2.width = width;
  tempCanvas2.height = height;
  tempCtx2.putImageData(imageData, 0, 0);
  thumbCtx.drawImage(tempCanvas2, 0, 0, thumbW, thumbH);
  return thumbCanvas.toDataURL('image/png');
}

function syncCurrentImageToState() {
  if (state.currentImageIndex < 0) return;
  if (!state.selectedImages.includes(state.currentImageIndex)) return;

  const currentImg = state.images[state.currentImageIndex];
  const latestEntry = currentImg.history[currentImg.historyIndex];
  const { canvas, ctx } = state;

  canvas.width = latestEntry.width;
  canvas.height = latestEntry.height;
  state.width = latestEntry.width;
  state.height = latestEntry.height;
  ctx.clearRect(0, 0, latestEntry.width, latestEntry.height);
  ctx.putImageData(latestEntry.imageData, 0, 0);

  state.history = currentImg.history.map(entry => cloneHistoryEntry(entry));
  state.historyIndex = currentImg.historyIndex;

  if (latestEntry.bgType !== undefined) {
    state.bgType = latestEntry.bgType;
    state.bgColor = latestEntry.bgColor;
    state.gradientStart = latestEntry.gradientStart;
    state.gradientEnd = latestEntry.gradientEnd;
    state.gradientAngle = latestEntry.gradientAngle;
  }

  renderWithBackground();
}

function getCornerColors(ctx, canvas) {
  return [
    ctx.getImageData(0, 0, 1, 1).data,
    ctx.getImageData(canvas.width - 1, 0, 1, 1).data,
    ctx.getImageData(0, canvas.height - 1, 1, 1).data,
    ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data
  ];
}

function averageCornerColors(cornerColors) {
  const avgR = cornerColors.reduce((s, c) => s + c[0], 0) / 4;
  const avgG = cornerColors.reduce((s, c) => s + c[1], 0) / 4;
  const avgB = cornerColors.reduce((s, c) => s + c[2], 0) / 4;
  return { r: avgR, g: avgG, b: avgB };
}

export function batchRemoveBg() {
  if (state.selectedImages.length === 0) {
    showToast('请先选择图片', 'error');
    return;
  }

  const tolerance = parseInt($('toleranceRange').value);
  const feather = parseInt($('featherRange').value);
  const toleranceValue = tolerance * 2.55;

  let successCount = 0;

  for (const index of state.selectedImages) {
    const img = state.images[index];
    if (!img) continue;

    try {
      const result = processImageSync(img, (canvas, ctx) => {
        const cornerColors = getCornerColors(ctx, canvas);
        const { r, g, b } = averageCornerColors(cornerColors);
        floodFillRemoveBg(r, g, b, toleranceValue, feather);
      });

      const currentEntry = img.history[img.historyIndex];
      const historyEntry = createHistoryEntry(
        result.imageData,
        result.width,
        result.height,
        currentEntry.bgType,
        currentEntry.bgColor,
        currentEntry.gradientStart,
        currentEntry.gradientEnd,
        currentEntry.gradientAngle
      );

      img.history = img.history.slice(0, img.historyIndex + 1);
      img.history.push(historyEntry);
      img.historyIndex = img.history.length - 1;
      img.imageData = new ImageData(
        new Uint8ClampedArray(result.imageData.data),
        result.imageData.width,
        result.imageData.height
      );
      img.thumbnail = regenerateThumbnail(result.imageData, result.width, result.height);

      successCount++;
    } catch (e) {
      console.error(`处理图片 ${index} 出错:`, e);
    }
  }

  syncCurrentImageToState();
  renderThumbnails();

  if (successCount > 0) {
    showToast(`批量抠图完成，共 ${successCount} 张`, 'success');
  } else {
    showToast('批量抠图失败', 'error');
  }
}

export function batchApplyBackground() {
  if (state.selectedImages.length === 0) {
    showToast('请先选择图片', 'error');
    return;
  }

  const bgType = state.bgType;
  const bgColor = state.bgColor;
  const gradientStart = state.gradientStart;
  const gradientEnd = state.gradientEnd;
  const gradientAngle = state.gradientAngle;

  let successCount = 0;

  for (const index of state.selectedImages) {
    const img = state.images[index];
    if (!img) continue;

    try {
      const currentEntry = img.history[img.historyIndex];
      const historyEntry = createHistoryEntry(
        currentEntry.imageData,
        currentEntry.width,
        currentEntry.height,
        bgType,
        bgColor,
        gradientStart,
        gradientEnd,
        gradientAngle
      );

      img.history = img.history.slice(0, img.historyIndex + 1);
      img.history.push(historyEntry);
      img.historyIndex = img.history.length - 1;

      successCount++;
    } catch (e) {
      console.error(`处理图片 ${index} 出错:`, e);
    }
  }

  syncCurrentImageToState();

  if (successCount > 0) {
    showToast(`批量背景设置完成，共 ${successCount} 张`, 'success');
  } else {
    showToast('批量背景设置失败', 'error');
  }
}

export function batchApplyParams(tolerance, feather) {
  if (state.selectedImages.length === 0) {
    showToast('请先选择图片', 'error');
    return;
  }

  const toleranceValue = tolerance * 2.55;
  let successCount = 0;

  for (const index of state.selectedImages) {
    const img = state.images[index];
    if (!img) continue;
    if (img.history.length < 1) continue;

    try {
      const originalEntry = img.history[0];
      const imgForProcess = {
        ...img,
        history: [cloneHistoryEntry(originalEntry)],
        historyIndex: 0,
        width: originalEntry.width,
        height: originalEntry.height
      };

      const result = processImageSync(imgForProcess, (canvas, ctx) => {
        const cornerColors = getCornerColors(ctx, canvas);
        const { r, g, b } = averageCornerColors(cornerColors);
        floodFillRemoveBg(r, g, b, toleranceValue, feather);
      });

      const currentEntry = img.history[img.historyIndex];
      const historyEntry = createHistoryEntry(
        result.imageData,
        result.width,
        result.height,
        currentEntry.bgType,
        currentEntry.bgColor,
        currentEntry.gradientStart,
        currentEntry.gradientEnd,
        currentEntry.gradientAngle
      );

      img.history = img.history.slice(0, img.historyIndex + 1);
      img.history.push(historyEntry);
      img.historyIndex = img.history.length - 1;
      img.imageData = new ImageData(
        new Uint8ClampedArray(result.imageData.data),
        result.imageData.width,
        result.imageData.height
      );
      img.thumbnail = regenerateThumbnail(result.imageData, result.width, result.height);

      successCount++;
    } catch (e) {
      console.error(`处理图片 ${index} 出错:`, e);
    }
  }

  syncCurrentImageToState();
  renderThumbnails();

  if (successCount > 0) {
    showToast(`批量参数应用完成，共 ${successCount} 张`, 'success');
  } else {
    showToast('批量参数应用失败', 'error');
  }
}
