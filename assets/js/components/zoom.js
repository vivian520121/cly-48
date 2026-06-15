import { state } from '../core/state.js';
import { $ } from '../core/dom.js';

export function fitZoom() {
  const { canvas } = state;
  const container = $('canvasContainer');
  const padding = 40;
  const maxW = container.clientWidth - padding;
  const maxH = container.clientHeight - padding;
  const zoom = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
  setZoom(zoom);
}

export function setZoom(zoom) {
  const { canvas } = state;
  state.zoom = Math.max(0.1, Math.min(5, zoom));
  canvas.style.width = (canvas.width * state.zoom) + 'px';
  canvas.style.height = (canvas.height * state.zoom) + 'px';
  $('zoomDisplay').textContent = Math.round(state.zoom * 100) + '%';
}
