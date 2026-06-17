import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { saveHistory } from '../core/history.js';
import { floodFillRemoveBg } from '../components/removeBg.js';
import { renderWithBackground } from '../components/background.js';
import { showToast } from './toast.js';
import { getColorAtPosition } from '../components/canvas.js';

let bgSaveDebounceTimer = null;
function debounceSaveBgHistory() {
  if (!state.imageLoaded) return;
  if (bgSaveDebounceTimer) {
    clearTimeout(bgSaveDebounceTimer);
  }
  bgSaveDebounceTimer = setTimeout(() => {
    saveHistory();
    bgSaveDebounceTimer = null;
  }, 300);
}

export function initSidebarEvents({ onRemoveBg, onPickColor, onBgTypeChange, onClear, onCrop, onExport, onBatchRemoveBg, onBatchBgApply, onBatchParamsApply, onSelectAll, onDeselectAll }) {
  document.querySelectorAll('.sidebar-section').forEach(section => {
    const collapseBtn = section.querySelector('.collapse-btn');
    const title = section.querySelector('.section-title');
    
    collapseBtn.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });
    
    title.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });
  });

  $('toleranceRange').addEventListener('input', e => {
    $('toleranceInput').value = e.target.value;
  });
  $('toleranceInput').addEventListener('input', e => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(100, value));
    e.target.value = value;
    $('toleranceRange').value = value;
  });

  $('featherRange').addEventListener('input', e => {
    $('featherInput').value = e.target.value;
  });
  $('featherInput').addEventListener('input', e => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(20, value));
    e.target.value = value;
    $('featherRange').value = value;
  });

  $('removeBgBtn').addEventListener('click', () => {
    onRemoveBg?.();
  });

  $('pickBgColorBtn').addEventListener('click', () => {
    onPickColor?.();
  });

  document.querySelectorAll('#bgTypeGroup .radio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bgTypeGroup .radio-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      state.bgType = type;
      $('solidBgGroup').style.display = type === 'solid' ? 'block' : 'none';
      $('gradientBgGroup').style.display = type === 'gradient' ? 'block' : 'none';
      renderWithBackground();
      saveHistory();
      onBgTypeChange?.(type);
    });
  });

  $('bgColor').addEventListener('input', e => {
    state.bgColor = e.target.value;
    $('bgColorHex').value = e.target.value;
    renderWithBackground();
    debounceSaveBgHistory();
  });
  $('bgColorHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.bgColor = e.target.value;
      $('bgColor').value = e.target.value;
      renderWithBackground();
      debounceSaveBgHistory();
    }
  });

  document.querySelectorAll('#solidBgGroup .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('#solidBgGroup .swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const color = sw.dataset.color;
      state.bgColor = color;
      $('bgColor').value = color;
      $('bgColorHex').value = color;
      renderWithBackground();
      saveHistory();
    });
  });

  $('gradientStart').addEventListener('input', e => {
    state.gradientStart = e.target.value;
    $('gradientStartHex').value = e.target.value;
    renderWithBackground();
    debounceSaveBgHistory();
  });
  $('gradientStartHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.gradientStart = e.target.value;
      $('gradientStart').value = e.target.value;
      renderWithBackground();
      debounceSaveBgHistory();
    }
  });
  $('gradientEnd').addEventListener('input', e => {
    state.gradientEnd = e.target.value;
    $('gradientEndHex').value = e.target.value;
    renderWithBackground();
    debounceSaveBgHistory();
  });
  $('gradientEndHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.gradientEnd = e.target.value;
      $('gradientEnd').value = e.target.value;
      renderWithBackground();
      debounceSaveBgHistory();
    }
  });
  $('gradientAngle').addEventListener('input', e => {
    state.gradientAngle = parseInt(e.target.value);
    $('gradientAngleInput').value = e.target.value;
    renderWithBackground();
    debounceSaveBgHistory();
  });
  $('gradientAngleInput').addEventListener('input', e => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(360, value));
    e.target.value = value;
    state.gradientAngle = value;
    $('gradientAngle').value = value;
    renderWithBackground();
    debounceSaveBgHistory();
  });

  $('clearBtn').addEventListener('click', () => onClear?.());
  $('cropBtn').addEventListener('click', () => onCrop?.());
  $('exportBtn').addEventListener('click', () => onExport?.());
  
  const selectAllBtn = $('selectAllBtn');
  const deselectAllBtn = $('deselectAllBtn');
  const batchRemoveBgBtn = $('batchRemoveBgBtn');
  const batchBgApplyBtn = $('batchBgApplyBtn');
  const batchParamsApplyBtn = $('batchParamsApplyBtn');
  
  if (selectAllBtn) selectAllBtn.addEventListener('click', () => onSelectAll?.());
  if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => onDeselectAll?.());
  if (batchRemoveBgBtn) batchRemoveBgBtn.addEventListener('click', () => onBatchRemoveBg?.());
  if (batchBgApplyBtn) batchBgApplyBtn.addEventListener('click', () => onBatchBgApply?.());
  if (batchParamsApplyBtn) batchParamsApplyBtn.addEventListener('click', () => onBatchParamsApply?.());
}
