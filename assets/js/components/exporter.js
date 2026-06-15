import { state } from '../core/state.js';
import { createBackgroundStyle } from './background.js';
import { showToast } from '../ui/toast.js';

export function exportPNG() {
  if (!state.imageLoaded) return;
  const { canvas } = state;
  
  const bgStyle = createBackgroundStyle();
  let finalCanvas = canvas;
  
  if (bgStyle) {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const fctx = finalCanvas.getContext('2d');
    fctx.fillStyle = bgStyle;
    fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    fctx.drawImage(canvas, 0, 0);
  }
  
  const link = document.createElement('a');
  link.download = `processed-image-${Date.now()}.png`;
  link.href = finalCanvas.toDataURL('image/png');
  link.click();
  showToast('图片导出成功', 'success');
}
