import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { floodFillRemoveBg } from './removeBg.js';
import { renderWithBackground } from './background.js';
import { showToast } from '../ui/toast.js';
import { renderThumbnails } from './fileHandler.js';

function createHistoryEntry(imageData, width, height, bgType, bgColor, gradientStart, gradientEnd, gradientAngle) {
  return {
    width,
    height,
    imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
    bgType,
    bgColor,
    gradientStart,
    gradientEnd,
    gradientAngle
  };
}

function processImageOffscreen(imageObj, processFn) {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas.width = imageObj.width;
    tempCanvas.height = imageObj.height;
    
    const currentEntry = imageObj.history[imageObj.historyIndex];
    tempCtx.putImageData(currentEntry.imageData, 0, 0);
    
    processFn(tempCanvas, tempCtx, imageObj).then(() => {
      const resultImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      resolve({
        imageData: resultImageData,
        width: tempCanvas.width,
        height: tempCanvas.height
      });
    });
  });
}

export async function batchRemoveBg() {
  if (state.selectedImages.length === 0) {
    showToast('请先选择图片', 'error');
    return;
  }
  
  const tolerance = parseInt($('toleranceRange').value);
  const feather = parseInt($('featherRange').value);
  
  let successCount = 0;
  
  for (const index of state.selectedImages) {
    const img = state.images[index];
    if (!img) continue;
    
    const result = await processImageOffscreen(img, async (canvas, ctx, imageObj) => {
      const cornerColors = [
        ctx.getImageData(0, 0, 1, 1).data,
        ctx.getImageData(canvas.width - 1, 0, 1, 1).data,
        ctx.getImageData(0, canvas.height - 1, 1, 1).data,
        ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data
      ];
      
      const avgR = cornerColors.reduce((s, c) => s + c[0], 0) / 4;
      const avgG = cornerColors.reduce((s, c) => s + c[1], 0) / 4;
      const avgB = cornerColors.reduce((s, c) => s + c[2], 0) / 4;
      
      const origCtx = state.ctx;
      const origCanvas = state.canvas;
      state.ctx = ctx;
      state.canvas = canvas;
      
      floodFillRemoveBg(avgR, avgG, avgB, tolerance * 2.55, feather);
      
      state.ctx = origCtx;
      state.canvas = origCanvas;
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
    img.imageData = new ImageData(new Uint8ClampedArray(result.imageData.data), result.imageData.width, result.imageData.height);
    
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d');
    const thumbSize = 80;
    const thumbRatio = Math.min(thumbSize / result.width, thumbSize / result.height);
    const thumbW = Math.round(result.width * thumbRatio);
    const thumbH = Math.round(result.height * thumbRatio);
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    
    const tempCanvas2 = document.createElement('canvas');
    const tempCtx2 = tempCanvas2.getContext('2d');
    tempCanvas2.width = result.width;
    tempCanvas2.height = result.height;
    tempCtx2.putImageData(result.imageData, 0, 0);
    thumbCtx.drawImage(tempCanvas2, 0, 0, thumbW, thumbH);
    img.thumbnail = thumbCanvas.toDataURL('image/png');
    
    successCount++;
  }
  
  if (state.currentImageIndex >= 0 && state.selectedImages.includes(state.currentImageIndex)) {
    const currentImg = state.images[state.currentImageIndex];
    const latestEntry = currentImg.history[currentImg.historyIndex];
    const { canvas, ctx } = state;
    canvas.width = latestEntry.width;
    canvas.height = latestEntry.height;
    state.width = latestEntry.width;
    state.height = latestEntry.height;
    ctx.clearRect(0, 0, latestEntry.width, latestEntry.height);
    ctx.putImageData(latestEntry.imageData, 0, 0);
    
    state.history = currentImg.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height),
      bgType: entry.bgType,
      bgColor: entry.bgColor,
      gradientStart: entry.gradientStart,
      gradientEnd: entry.gradientEnd,
      gradientAngle: entry.gradientAngle
    }));
    state.historyIndex = currentImg.historyIndex;
    
    renderWithBackground();
  }
  
  renderThumbnails();
  
  if (successCount > 0) {
    showToast(`批量抠图完成，共 ${successCount} 张`, 'success');
  }
}

export async function batchApplyBackground() {
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
    
    const currentEntry = img.history[img.historyIndex];
    const historyEntry = {
      width: currentEntry.width,
      height: currentEntry.height,
      imageData: new ImageData(new Uint8ClampedArray(currentEntry.imageData.data), currentEntry.imageData.width, currentEntry.imageData.height),
      bgType,
      bgColor,
      gradientStart,
      gradientEnd,
      gradientAngle
    };
    
    img.history = img.history.slice(0, img.historyIndex + 1);
    img.history.push(historyEntry);
    img.historyIndex = img.history.length - 1;
    
    successCount++;
  }
  
  if (state.currentImageIndex >= 0 && state.selectedImages.includes(state.currentImageIndex)) {
    const currentImg = state.images[state.currentImageIndex];
    state.history = currentImg.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height),
      bgType: entry.bgType,
      bgColor: entry.bgColor,
      gradientStart: entry.gradientStart,
      gradientEnd: entry.gradientEnd,
      gradientAngle: entry.gradientAngle
    }));
    state.historyIndex = currentImg.historyIndex;
    renderWithBackground();
  }
  
  showToast(`批量背景设置完成，共 ${successCount} 张`, 'success');
}

export async function batchApplyParams(tolerance, feather) {
  if (state.selectedImages.length === 0) {
    showToast('请先选择图片', 'error');
    return;
  }
  
  let successCount = 0;
  
  for (const index of state.selectedImages) {
    const img = state.images[index];
    if (!img) continue;
    
    const originalEntry = img.history[0];
    if (!originalEntry) continue;
    
    const result = await processImageOffscreen({ 
      ...img, 
      history: [originalEntry], 
      historyIndex: 0,
      width: originalEntry.width,
      height: originalEntry.height
    }, async (canvas, ctx, imageObj) => {
      const cornerColors = [
        ctx.getImageData(0, 0, 1, 1).data,
        ctx.getImageData(canvas.width - 1, 0, 1, 1).data,
        ctx.getImageData(0, canvas.height - 1, 1, 1).data,
        ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data
      ];
      
      const avgR = cornerColors.reduce((s, c) => s + c[0], 0) / 4;
      const avgG = cornerColors.reduce((s, c) => s + c[1], 0) / 4;
      const avgB = cornerColors.reduce((s, c) => s + c[2], 0) / 4;
      
      const origCtx = state.ctx;
      const origCanvas = state.canvas;
      state.ctx = ctx;
      state.canvas = canvas;
      
      floodFillRemoveBg(avgR, avgG, avgB, tolerance * 2.55, feather);
      
      state.ctx = origCtx;
      state.canvas = origCanvas;
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
    img.imageData = new ImageData(new Uint8ClampedArray(result.imageData.data), result.imageData.width, result.imageData.height);
    
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d');
    const thumbSize = 80;
    const thumbRatio = Math.min(thumbSize / result.width, thumbSize / result.height);
    const thumbW = Math.round(result.width * thumbRatio);
    const thumbH = Math.round(result.height * thumbRatio);
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    
    const tempCanvas2 = document.createElement('canvas');
    const tempCtx2 = tempCanvas2.getContext('2d');
    tempCanvas2.width = result.width;
    tempCanvas2.height = result.height;
    tempCtx2.putImageData(result.imageData, 0, 0);
    thumbCtx.drawImage(tempCanvas2, 0, 0, thumbW, thumbH);
    img.thumbnail = thumbCanvas.toDataURL('image/png');
    
    successCount++;
  }
  
  if (state.currentImageIndex >= 0 && state.selectedImages.includes(state.currentImageIndex)) {
    const currentImg = state.images[state.currentImageIndex];
    const latestEntry = currentImg.history[currentImg.historyIndex];
    const { canvas, ctx } = state;
    canvas.width = latestEntry.width;
    canvas.height = latestEntry.height;
    state.width = latestEntry.width;
    state.height = latestEntry.height;
    ctx.clearRect(0, 0, latestEntry.width, latestEntry.height);
    ctx.putImageData(latestEntry.imageData, 0, 0);
    
    state.history = currentImg.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height),
      bgType: entry.bgType,
      bgColor: entry.bgColor,
      gradientStart: entry.gradientStart,
      gradientEnd: entry.gradientEnd,
      gradientAngle: entry.gradientAngle
    }));
    state.historyIndex = currentImg.historyIndex;
    
    renderWithBackground();
  }
  
  renderThumbnails();
  
  if (successCount > 0) {
    showToast(`批量参数应用完成，共 ${successCount} 张`, 'success');
  }
}
