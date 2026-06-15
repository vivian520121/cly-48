import { state } from '../core/state.js';
import { $ } from '../core/dom.js';

export function createBackgroundStyle() {
  const { canvas, ctx } = state;

  if (state.bgType === 'transparent') return null;
  
  if (state.bgType === 'solid') return state.bgColor;
  
  if (state.bgType === 'gradient') {
    const angle = state.gradientAngle * Math.PI / 180;
    const x1 = canvas.width / 2 - Math.cos(angle) * canvas.width;
    const y1 = canvas.height / 2 - Math.sin(angle) * canvas.height;
    const x2 = canvas.width / 2 + Math.cos(angle) * canvas.width;
    const y2 = canvas.height / 2 + Math.sin(angle) * canvas.height;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, state.gradientStart);
    gradient.addColorStop(1, state.gradientEnd);
    return gradient;
  }
  return null;
}

function setCheckerboardBackground(canvas) {
  canvas.style.backgroundImage = [
    'linear-gradient(45deg, #e0e0e0 25%, transparent 25%)',
    'linear-gradient(-45deg, #e0e0e0 25%, transparent 25%)',
    'linear-gradient(45deg, transparent 75%, #e0e0e0 75%)',
    'linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)'
  ].join(',');
  canvas.style.backgroundSize = '20px 20px';
  canvas.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
  canvas.style.backgroundColor = '#ffffff';
  canvas.style.backgroundRepeat = 'repeat';
}

function clearCheckerboardBackground(canvas) {
  canvas.style.backgroundImage = '';
  canvas.style.backgroundSize = '';
  canvas.style.backgroundPosition = '';
  canvas.style.backgroundColor = '';
  canvas.style.backgroundRepeat = '';
}

export function renderWithBackground() {
  const { canvas, ctx } = state;
  const wrapper = $('canvasWrapper');
  const bgStyle = createBackgroundStyle();
  if (!bgStyle) {
    clearCheckerboardBackground(canvas);
    setCheckerboardBackground(canvas);
    if (wrapper) wrapper.style.background = 'transparent';
    return;
  }
  
  clearCheckerboardBackground(canvas);
  if (wrapper) wrapper.style.background = '';

  if (typeof bgStyle === 'string') {
    canvas.style.background = bgStyle;
  } else {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = bgStyle;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    canvas.style.background = `url(${tempCanvas.toDataURL()})`;
  }
}
