import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { setZoom, fitZoom } from '../components/zoom.js';

export function initToolbarEvents({ onUndo, onRedo }) {
  $('undoBtn').addEventListener('click', () => onUndo?.());
  $('redoBtn').addEventListener('click', () => onRedo?.());
  $('zoomInBtn').addEventListener('click', () => setZoom(state.zoom * 1.2));
  $('zoomOutBtn').addEventListener('click', () => setZoom(state.zoom / 1.2));
  $('zoomFitBtn').addEventListener('click', fitZoom);
}
