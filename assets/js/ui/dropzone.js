import { $ } from '../core/dom.js';

export function initDropzoneEvents({ onFile }) {
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => onFile?.(e.target.files[0]));
  $('dropZone').addEventListener('click', () => $('fileInput').click());
  
  const container = $('canvasContainer');
  container.addEventListener('dragover', e => {
    e.preventDefault();
    $('dropZone').classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => $('dropZone').classList.remove('drag-over'));
  container.addEventListener('drop', e => {
    e.preventDefault();
    $('dropZone').classList.remove('drag-over');
    onFile?.(e.dataTransfer.files[0]);
  });
}
