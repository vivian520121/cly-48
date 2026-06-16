import { state, setState } from '../core/state.js';
import { $ } from '../core/dom.js';
import { updateImageButtons, updateStatusSize } from './canvas.js';
import { resetHistory, updateHistoryButtons } from '../core/history.js';
import { fitZoom } from './zoom.js';
import { renderWithBackground } from './background.js';
import { showToast } from '../ui/toast.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function processFile(file) {
  try {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const id = generateId();
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const maxSize = 2048;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCtx.drawImage(img, 0, 0, w, h);
    const imageData = tempCtx.getImageData(0, 0, w, h);
    
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d');
    const thumbSize = 80;
    const thumbRatio = Math.min(thumbSize / w, thumbSize / h);
    const thumbW = Math.round(w * thumbRatio);
    const thumbH = Math.round(h * thumbRatio);
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
    const thumbnail = thumbCanvas.toDataURL('image/png');
    
    const initialHistoryEntry = {
      width: w,
      height: h,
      imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
    };
    
    return {
      id,
      name: file.name,
      type: file.type,
      width: w,
      height: h,
      imageData,
      thumbnail,
      dataUrl,
      originalImageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
      history: [initialHistoryEntry],
      historyIndex: 0
    };
  } catch (e) {
    console.error('Error processing file:', e);
    return null;
  }
}

export async function handleFiles(files) {
  if (!files || files.length === 0) {
    showToast('请选择有效的图片文件', 'error');
    return;
  }
  
  const validFiles = files.filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    showToast('请选择有效的图片文件', 'error');
    return;
  }
  
  const results = [];
  for (const file of validFiles) {
    const result = await processFile(file);
    if (result) {
      results.push(result);
    }
  }
  
  if (results.length === 0) {
    showToast('图片加载失败', 'error');
    return;
  }
  
  const newImages = [...state.images, ...results];
  setState({ images: newImages });
  
  const lastIndex = newImages.length - 1;
  switchToImage(lastIndex);
  renderThumbnails();
  
  if (validFiles.length > 1) {
    showToast(`成功加载 ${results.length} 张图片`, 'success');
  } else {
    showToast('图片加载成功', 'success');
  }
}

export function switchToImage(index) {
  const images = state.images;
  if (index < 0 || index >= images.length) return;
  
  if (state.currentImageIndex >= 0 && state.imageLoaded) {
    const { canvas, ctx } = state;
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    images[state.currentImageIndex].imageData = currentImageData;
    images[state.currentImageIndex].originalImageData = state.originalImageData 
      ? new ImageData(new Uint8ClampedArray(state.originalImageData.data), state.originalImageData.width, state.originalImageData.height)
      : null;
    images[state.currentImageIndex].history = state.history.map(entry => ({
      width: entry.width,
      height: entry.height,
      imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height)
    }));
    images[state.currentImageIndex].historyIndex = state.historyIndex;
    
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d');
    const thumbSize = 80;
    const thumbRatio = Math.min(thumbSize / canvas.width, thumbSize / canvas.height);
    const thumbW = Math.round(canvas.width * thumbRatio);
    const thumbH = Math.round(canvas.height * thumbRatio);
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
    images[state.currentImageIndex].thumbnail = thumbCanvas.toDataURL('image/png');
  }
  
  const targetImg = images[index];
  setState({ currentImageIndex: index });
  
  const { canvas, ctx } = state;
  canvas.width = targetImg.width;
  canvas.height = targetImg.height;
  state.width = targetImg.width;
  state.height = targetImg.height;
  ctx.clearRect(0, 0, targetImg.width, targetImg.height);
  ctx.putImageData(targetImg.imageData, 0, 0);
  
  state.originalImageData = targetImg.originalImageData 
    ? new ImageData(new Uint8ClampedArray(targetImg.originalImageData.data), targetImg.originalImageData.width, targetImg.originalImageData.height)
    : null;
  state.history = targetImg.history.map(entry => ({
    width: entry.width,
    height: entry.height,
    imageData: new ImageData(new Uint8ClampedArray(entry.imageData.data), entry.imageData.width, entry.imageData.height)
  }));
  state.historyIndex = targetImg.historyIndex;
  
  updateImageButtons(true);
  updateHistoryButtons();
  
  const dropZone = $('dropZone');
  if (dropZone) dropZone.classList.add('hidden');
  
  const statusFile = $('statusFile');
  if (statusFile) {
    statusFile.textContent = `文件: ${targetImg.name}`;
    statusFile.style.display = 'flex';
  }
  
  updateStatusSize();
  fitZoom();
  renderWithBackground();
  renderThumbnails();
}

export function updateThumbnailActive() {
  const track = $('thumbnailTrack');
  if (!track) return;
  
  const thumbs = track.querySelectorAll('.thumbnail-item');
  thumbs.forEach((thumb, i) => {
    if (i === state.currentImageIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

export function renderThumbnails() {
  const bar = $('thumbnailBar');
  const track = $('thumbnailTrack');
  if (!bar || !track) return;
  
  if (state.images.length === 0) {
    bar.style.display = 'none';
    return;
  }
  
  bar.style.display = 'flex';
  track.innerHTML = '';
  
  state.images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item' + (index === state.currentImageIndex ? ' active' : '');
    item.dataset.index = index;
    
    const thumb = document.createElement('img');
    thumb.src = img.thumbnail;
    thumb.alt = img.name;
    thumb.className = 'thumbnail-img';
    
    const label = document.createElement('div');
    label.className = 'thumbnail-label';
    label.textContent = img.name;
    label.title = img.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'thumbnail-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = '移除';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      removeImage(index);
    });
    
    item.appendChild(thumb);
    item.appendChild(label);
    item.appendChild(removeBtn);
    
    item.addEventListener('click', () => switchToImage(index));
    
    track.appendChild(item);
  });
}

export function removeImage(index) {
  const images = [...state.images];
  if (index < 0 || index >= images.length) return;
  
  images.splice(index, 1);
  
  if (images.length === 0) {
    setState({ images: [], currentImageIndex: -1 });
    clearAllImages();
  } else {
    let newIndex = state.currentImageIndex;
    if (index === state.currentImageIndex) {
      newIndex = Math.min(index, images.length - 1);
    } else if (index < state.currentImageIndex) {
      newIndex = state.currentImageIndex - 1;
    }
    setState({ images, currentImageIndex: newIndex });
    switchToImage(newIndex);
    renderThumbnails();
  }
  
  showToast('已移除图片');
}

function clearAllImages() {
  const { canvas, ctx } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.imageLoaded = false;
  state.originalImageData = null;
  
  $('dropZone').classList.remove('hidden');
  $('statusSize').style.display = 'none';
  $('statusFile').style.display = 'none';
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.background = '';
  canvas.style.backgroundImage = '';
  canvas.style.backgroundSize = '';
  canvas.style.backgroundPosition = '';
  canvas.style.backgroundColor = '';
  canvas.style.backgroundRepeat = '';
  
  const wrapper = $('canvasWrapper');
  if (wrapper) wrapper.style.background = '';
  
  updateImageButtons(false);
  resetHistory();
  renderThumbnails();
}

export function handleFile(file) {
  handleFiles([file]);
}
