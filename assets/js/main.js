import { $ } from './core/dom.js';
import { state } from './core/state.js';
import { saveHistory, undo, redo, restoreFromHistory, resetHistory, updateHistoryButtons } from './core/history.js';
import { initCanvas, updateImageButtons, updateStatusSize, getColorAtPosition, clearCanvas as clearCanvasFn } from './components/canvas.js';
import { renderWithBackground } from './components/background.js';
import { floodFillRemoveBg } from './components/removeBg.js';
import { setZoom, fitZoom } from './components/zoom.js';
import { startCropMode, endCropMode, updateCropOverlay, handleCropMouseDown, handleCanvasWrapperMouseDown, handleCropMouseMove, handleCropMouseUp } from './components/crop.js';
import { handleFile } from './components/fileHandler.js';
import { exportPNG } from './components/exporter.js';
import { showToast } from './ui/toast.js';
import { initSidebarEvents } from './ui/sidebar.js';
import { initToolbarEvents } from './ui/toolbar.js';
import { initDropzoneEvents } from './ui/dropzone.js';

function handleRemoveBg() {
  saveHistory();
  const { canvas, ctx } = state;
  const tolerance = parseInt($('toleranceRange').value);
  const feather = parseInt($('featherRange').value);
  
  const cornerColors = [
    ctx.getImageData(0, 0, 1, 1).data,
    ctx.getImageData(canvas.width - 1, 0, 1, 1).data,
    ctx.getImageData(0, canvas.height - 1, 1, 1).data,
    ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data
  ];
  
  const avgR = cornerColors.reduce((s, c) => s + c[0], 0) / 4;
  const avgG = cornerColors.reduce((s, c) => s + c[1], 0) / 4;
  const avgB = cornerColors.reduce((s, c) => s + c[2], 0) / 4;
  
  floodFillRemoveBg(avgR, avgG, avgB, tolerance * 2.55, feather);
  renderWithBackground();
  showToast('抠图完成', 'success');
}

function handlePickColor() {
  state.isPickingColor = true;
  showToast('请点击画布上要抠除的颜色');
}

function handleCanvasClick(e) {
  if (!state.isPickingColor) return;
  const color = getColorAtPosition(e);
  if (color) {
    saveHistory();
    const tolerance = parseInt($('toleranceRange').value);
    const feather = parseInt($('featherRange').value);
    floodFillRemoveBg(color.r, color.g, color.b, tolerance * 2.55, feather);
    renderWithBackground();
    showToast('抠图完成', 'success');
  }
  state.isPickingColor = false;
}

function handleClear() {
  clearCanvasFn();
  resetHistory();
  updateImageButtons(false);
  showToast('画布已清除');
}

function handleCropApply(apply) {
  endCropMode(apply);
  if (apply) {
    updateStatusSize();
  }
}

function initGlobalEvents() {
  const applyCropBtn = $('applyCropBtn');
  const cancelCropBtn = $('cancelCropBtn');
  const cropRect = $('cropRect');
  const canvasWrapper = $('canvasWrapper');
  
  applyCropBtn?.addEventListener('click', () => handleCropApply(true));
  cancelCropBtn?.addEventListener('click', () => handleCropApply(false));
  cropRect?.addEventListener('mousedown', handleCropMouseDown);
  canvasWrapper?.addEventListener('mousedown', handleCanvasWrapperMouseDown);
  state.canvas?.addEventListener('click', handleCanvasClick);

  document.addEventListener('mousemove', handleCropMouseMove);
  document.addEventListener('mouseup', handleCropMouseUp);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); restoreFromHistory(); renderWithBackground(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); restoreFromHistory(); renderWithBackground(); }
  });

  window.addEventListener('resize', () => {
    if (state.cropMode) updateCropOverlay();
  });
}

function initApp() {
  initCanvas();
  updateHistoryButtons();

  initDropzoneEvents({ onFile: handleFile });
  initToolbarEvents({
    onUndo: () => { undo(); restoreFromHistory(); renderWithBackground(); },
    onRedo: () => { redo(); restoreFromHistory(); renderWithBackground(); }
  });
  initSidebarEvents({
    onRemoveBg: handleRemoveBg,
    onPickColor: handlePickColor,
    onClear: handleClear,
    onCrop: startCropMode,
    onExport: exportPNG
  });

  initGlobalEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
