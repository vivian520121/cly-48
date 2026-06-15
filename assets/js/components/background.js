import { state } from '../core/state.js';

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

export function renderWithBackground() {
  const { canvas, ctx } = state;
  const bgStyle = createBackgroundStyle();
  if (!bgStyle) {
    canvas.style.background = '';
    return;
  }
  
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
