import { $ } from '../core/dom.js';

export function initDropzoneEvents({ onFile }) {
  const uploadBtn = $('uploadBtn');
  const fileInput = $('fileInput');
  const dropZone = $('dropZone');
  const container = $('canvasContainer');
  
  if (!uploadBtn || !fileInput || !dropZone || !container) {
    return;
  }
  
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => onFile?.(e.target.files[0]));
  dropZone.addEventListener('click', () => fileInput.click());
  
  container.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  container.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    onFile?.(e.dataTransfer.files[0]);
  });
}
