import { $ } from '../core/dom.js';
import { state } from '../core/state.js';

export function initDropzoneEvents({ onFiles }) {
  const uploadBtn = $('uploadBtn');
  const fileInput = $('fileInput');
  const dropZone = $('dropZone');
  const container = $('canvasContainer');
  const canvasWrapper = $('canvasWrapper');
  
  if (!uploadBtn || !fileInput || !dropZone || !container) {
    return;
  }
  
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      onFiles?.(Array.from(e.target.files));
    }
    fileInput.value = '';
  });
  dropZone.addEventListener('click', () => fileInput.click());
  
  let dragCounter = 0;
  
  container.addEventListener('dragenter', e => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dropZone.classList.add('drag-over');
      if (state.imageLoaded && canvasWrapper) {
        canvasWrapper.classList.add('drag-highlight');
      }
    }
  });
  
  container.addEventListener('dragover', e => {
    e.preventDefault();
  });
  
  container.addEventListener('dragleave', e => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.classList.remove('drag-over');
      if (canvasWrapper) {
        canvasWrapper.classList.remove('drag-highlight');
      }
    }
  });
  
  container.addEventListener('drop', e => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
    if (canvasWrapper) {
      canvasWrapper.classList.remove('drag-highlight');
    }
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      onFiles?.(files);
    }
  });
}
