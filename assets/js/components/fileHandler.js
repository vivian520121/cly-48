import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { loadImageToCanvas, updateImageButtons, updateStatusSize } from './canvas.js';
import { saveHistory, resetHistory } from '../core/history.js';
import { fitZoom } from './zoom.js';
import { renderWithBackground } from './background.js';
import { showToast } from '../ui/toast.js';

export function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('请选择有效的图片文件', 'error');
    return;
  }

  $('statusFile').textContent = `文件: ${file.name}`;
  $('statusFile').style.display = 'flex';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      resetHistory();
      loadImageToCanvas(img);
      saveHistory();
      const { canvas, ctx } = state;
      state.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      updateImageButtons(true);
      $('dropZone').classList.add('hidden');
      updateStatusSize();
      fitZoom();
      renderWithBackground();
      showToast('图片加载成功', 'success');
    };
    img.onerror = () => showToast('图片加载失败', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
