import { state, setState } from '../core/state.js';
import { $ } from '../core/dom.js';
import { saveHistory } from '../core/history.js';

export function initCanvas() {
  const canvas = $('mainCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  state.canvas = canvas;
  state.ctx = ctx;
}

export function loadImageToCanvas(img) {
  const { canvas, ctx } = state;
  const maxSize = 2048;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  
  if (w > maxSize || h > maxSize) {
    const ratio = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  canvas.width = w;
  canvas.height = h;
  state.width = w;
  state.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
}

export function updateImageButtons(enabled) {
  state.imageLoaded = enabled;
  $('clearBtn').disabled = !enabled;
  $('removeBgBtn').disabled = !enabled;
  $('pickBgColorBtn').disabled = !enabled;
  $('cropBtn').disabled = !enabled;
  $('exportBtn').disabled = !enabled;
  $('zoomInBtn').disabled = !enabled;
  $('zoomOutBtn').disabled = !enabled;
  $('zoomFitBtn').disabled = !enabled;
}

export function updateStatusSize() {
  const { canvas } = state;
  $('statusSize').textContent = `尺寸: ${canvas.width} × ${canvas.height}`;
  $('statusSize').style.display = 'flex';
}

export function getColorAtPosition(e) {
  const { canvas, ctx } = state;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null;
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2] };
}

export function clearCanvas() {
  if (!state.imageLoaded) return;
  const { canvas, ctx } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.imageLoaded = false;
  $('dropZone').classList.remove('hidden');
  $('statusSize').style.display = 'none';
  $('statusFile').style.display = 'none';
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.background = '';
  canvas.style.backgroundImage = '';
  canvas.style.backgroundSize = '';
  canvas.style.backgroundPosition = '';
  canvas.style.backgroundColor = '';
  canvas.style.backgroundRepeat = '';
  const wrapper = $('canvasWrapper');
  if (wrapper) wrapper.style.background = '';
}
