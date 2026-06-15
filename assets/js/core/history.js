import { state } from './state.js';
import { $ } from './dom.js';

export function saveHistory() {
  if (!state.imageLoaded) return;
  const { canvas, ctx } = state;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({
    width: canvas.width,
    height: canvas.height,
    imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
  });
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

export function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  restoreFromHistory();
}

export function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  restoreFromHistory();
}

export function restoreFromHistory() {
  const entry = state.history[state.historyIndex];
  if (!entry) return;
  const { canvas, ctx } = state;
  canvas.width = entry.width;
  canvas.height = entry.height;
  state.width = entry.width;
  state.height = entry.height;
  ctx.putImageData(entry.imageData, 0, 0);
  updateHistoryButtons();
}

export function updateHistoryButtons() {
  $('undoBtn').disabled = state.historyIndex <= 0;
  $('redoBtn').disabled = state.historyIndex >= state.history.length - 1;
}

export function resetHistory() {
  state.history = [];
  state.historyIndex = -1;
  updateHistoryButtons();
}
