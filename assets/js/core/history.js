import { state } from './state.js';
import { $ } from './dom.js';
import { renderWithBackground } from '../components/background.js';

export function saveHistory() {
  if (!state.imageLoaded) return;
  const { canvas, ctx } = state;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  state.history = state.history.slice(0, state.historyIndex + 1);
  const historyEntry = {
    width: canvas.width,
    height: canvas.height,
    imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
    bgType: state.bgType,
    bgColor: state.bgColor,
    gradientStart: state.gradientStart,
    gradientEnd: state.gradientEnd,
    gradientAngle: state.gradientAngle
  };
  state.history.push(historyEntry);
  state.historyIndex = state.history.length - 1;
  
  if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
    const currentImg = state.images[state.currentImageIndex];
    currentImg.history = state.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height),
      bgType: entry.bgType,
      bgColor: entry.bgColor,
      gradientStart: entry.gradientStart,
      gradientEnd: entry.gradientEnd,
      gradientAngle: entry.gradientAngle
    }));
    currentImg.historyIndex = state.historyIndex;
    currentImg.imageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }
  
  updateHistoryButtons();
}

export function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  restoreFromHistory();
  syncHistoryToCurrentImage();
}

export function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  restoreFromHistory();
  syncHistoryToCurrentImage();
}

function syncHistoryToCurrentImage() {
  if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
    const currentImg = state.images[state.currentImageIndex];
    currentImg.history = state.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height),
      bgType: entry.bgType,
      bgColor: entry.bgColor,
      gradientStart: entry.gradientStart,
      gradientEnd: entry.gradientEnd,
      gradientAngle: entry.gradientAngle
    }));
    currentImg.historyIndex = state.historyIndex;
    const { canvas, ctx } = state;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImg.imageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }
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
  
  if (entry.bgType !== undefined) {
    state.bgType = entry.bgType;
    state.bgColor = entry.bgColor;
    state.gradientStart = entry.gradientStart;
    state.gradientEnd = entry.gradientEnd;
    state.gradientAngle = entry.gradientAngle;
    renderWithBackground();
  }
  
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
