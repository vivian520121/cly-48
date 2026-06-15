import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { saveHistory } from '../core/history.js';
import { fitZoom, setZoom } from './zoom.js';
import { renderWithBackground } from './background.js';
import { showToast } from '../ui/toast.js';
import { updateStatusSize } from './canvas.js';

let cropDragState = null;

export function getCropCanvasCoords(e) {
  const { canvas } = state;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleX
  };
}

export function startCropMode() {
  if (!state.imageLoaded) return;
  const { canvas } = state;
  state.cropMode = true;
  document.body.classList.add('crop-mode');
  
  const margin = Math.min(canvas.width, canvas.height) * 0.1;
  state.cropRect = {
    x: margin,
    y: margin,
    w: canvas.width - margin * 2,
    h: canvas.height - margin * 2
  };
  
  $('cropBtn').style.display = 'none';
  $('applyCropBtn').style.display = 'flex';
  $('cancelCropBtn').style.display = 'flex';
  $('applyCropBtn').disabled = false;
  $('cancelCropBtn').disabled = false;
  
  updateCropOverlay();
}

export function endCropMode(apply = false) {
  state.cropMode = false;
  document.body.classList.remove('crop-mode');
  $('cropRect').classList.remove('active');
  $('cropBtn').style.display = 'flex';
  $('applyCropBtn').style.display = 'none';
  $('cancelCropBtn').style.display = 'none';
  
  ['cropMaskTop', 'cropMaskRight', 'cropMaskBottom', 'cropMaskLeft'].forEach(id => {
    $(id).style.display = 'none';
  });
  
  if (apply) applyCrop();
}

export function applyCrop() {
  const { canvas, ctx } = state;
  const { x, y, w, h } = state.cropRect;
  const ix = Math.max(0, Math.floor(x));
  const iy = Math.max(0, Math.floor(y));
  const iw = Math.min(canvas.width - ix, Math.floor(w));
  const ih = Math.min(canvas.height - iy, Math.floor(h));
  
  if (iw < 10 || ih < 10) {
    showToast('裁剪区域太小', 'error');
    return;
  }
  
  saveHistory();
  
  const cropped = ctx.getImageData(ix, iy, iw, ih);
  canvas.width = iw;
  canvas.height = ih;
  state.width = iw;
  state.height = ih;
  ctx.putImageData(cropped, 0, 0);
  updateStatusSize();
  fitZoom();
  renderWithBackground();
  showToast('裁剪成功', 'success');
}

export function updateCropOverlay() {
  const { canvas } = state;
  const wrapper = $('canvasWrapper');
  const rect = canvas.getBoundingClientRect();
  const wrapRect = wrapper.getBoundingClientRect();
  
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  
  const offsetX = rect.left - wrapRect.left;
  const offsetY = rect.top - wrapRect.top;
  
  const cropRectEl = $('cropRect');
  cropRectEl.classList.add('active');
  cropRectEl.style.left = (offsetX + state.cropRect.x * scaleX) + 'px';
  cropRectEl.style.top = (offsetY + state.cropRect.y * scaleY) + 'px';
  cropRectEl.style.width = (state.cropRect.w * scaleX) + 'px';
  cropRectEl.style.height = (state.cropRect.h * scaleY) + 'px';
  
  const masks = {
    cropMaskTop: { left: offsetX, top: offsetY, w: rect.width, h: state.cropRect.y * scaleY },
    cropMaskLeft: { left: offsetX, top: offsetY + state.cropRect.y * scaleY, w: state.cropRect.x * scaleX, h: state.cropRect.h * scaleY },
    cropMaskRight: { left: offsetX + (state.cropRect.x + state.cropRect.w) * scaleX, top: offsetY + state.cropRect.y * scaleY, w: rect.width - (state.cropRect.x + state.cropRect.w) * scaleX, h: state.cropRect.h * scaleY },
    cropMaskBottom: { left: offsetX, top: offsetY + (state.cropRect.y + state.cropRect.h) * scaleY, w: rect.width, h: rect.height - (state.cropRect.y + state.cropRect.h) * scaleY }
  };
  
  Object.keys(masks).forEach(id => {
    const m = masks[id];
    const el = $(id);
    el.style.display = 'block';
    el.style.left = m.left + 'px';
    el.style.top = m.top + 'px';
    el.style.width = Math.max(0, m.w) + 'px';
    el.style.height = Math.max(0, m.h) + 'px';
  });
}

export function handleCropMouseDown(e) {
  if (!state.cropMode) return;
  e.stopPropagation();
  const handle = e.target.dataset.handle;
  const pos = getCropCanvasCoords(e);
  cropDragState = { handle, startX: pos.x, startY: pos.y, rect: { ...state.cropRect } };
}

export function handleCanvasWrapperMouseDown(e) {
  if (!state.cropMode) return;
  if (e.target.closest('#cropRect')) return;
  const pos = getCropCanvasCoords(e);
  state.cropRect.x = pos.x;
  state.cropRect.y = pos.y;
  state.cropRect.w = 0;
  state.cropRect.h = 0;
  cropDragState = { handle: 'se', startX: pos.x, startY: pos.y, rect: { ...state.cropRect } };
  updateCropOverlay();
}

export function handleCropMouseMove(e) {
  if (!cropDragState || !state.cropMode) return;
  const { canvas } = state;
  const pos = getCropCanvasCoords(e);
  const dx = pos.x - cropDragState.startX;
  const dy = pos.y - cropDragState.startY;
  const r = cropDragState.rect;
  
  let { x, y, w, h } = r;
  
  switch (cropDragState.handle) {
    case 'move':
      x = r.x + dx;
      y = r.y + dy;
      break;
    case 'nw':
      x = r.x + dx;
      y = r.y + dy;
      w = r.w - dx;
      h = r.h - dy;
      break;
    case 'n':
      y = r.y + dy;
      h = r.h - dy;
      break;
    case 'ne':
      y = r.y + dy;
      w = r.w + dx;
      h = r.h - dy;
      break;
    case 'e':
      w = r.w + dx;
      break;
    case 'se':
      w = r.w + dx;
      h = r.h + dy;
      break;
    case 's':
      h = r.h + dy;
      break;
    case 'sw':
      x = r.x + dx;
      w = r.w - dx;
      h = r.h + dy;
      break;
    case 'w':
      x = r.x + dx;
      w = r.w - dx;
      break;
    default:
      x = r.x + dx;
      y = r.y + dy;
      w = r.w + dx;
      h = r.h + dy;
  }
  
  if (w < 5) { x = r.x + r.w - 5; w = 5; }
  if (h < 5) { y = r.y + r.h - 5; h = 5; }
  
  x = Math.max(0, Math.min(canvas.width - w, x));
  y = Math.max(0, Math.min(canvas.height - h, y));
  w = Math.min(w, canvas.width - x);
  h = Math.min(h, canvas.height - y);
  
  state.cropRect = { x, y, w, h };
  updateCropOverlay();
}

export function handleCropMouseUp() {
  cropDragState = null;
}
