import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { saveHistory } from '../core/history.js';
import { floodFillRemoveBg } from '../components/removeBg.js';
import { renderWithBackground } from '../components/background.js';
import { showToast } from './toast.js';
import { getColorAtPosition } from '../components/canvas.js';

export function initSidebarEvents({ onRemoveBg, onPickColor, onBgTypeChange, onClear, onCrop, onExport }) {
  $('toleranceRange').addEventListener('input', e => {
    $('toleranceValue').textContent = e.target.value;
  });
  $('featherRange').addEventListener('input', e => {
    $('featherValue').textContent = e.target.value;
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
      onBgTypeChange?.(type);
    });
  });

  $('bgColor').addEventListener('input', e => {
    state.bgColor = e.target.value;
    $('bgColorHex').value = e.target.value;
    renderWithBackground();
  });
  $('bgColorHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.bgColor = e.target.value;
      $('bgColor').value = e.target.value;
      renderWithBackground();
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
    });
  });

  $('gradientStart').addEventListener('input', e => {
    state.gradientStart = e.target.value;
    $('gradientStartHex').value = e.target.value;
    renderWithBackground();
  });
  $('gradientStartHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.gradientStart = e.target.value;
      $('gradientStart').value = e.target.value;
      renderWithBackground();
    }
  });
  $('gradientEnd').addEventListener('input', e => {
    state.gradientEnd = e.target.value;
    $('gradientEndHex').value = e.target.value;
    renderWithBackground();
  });
  $('gradientEndHex').addEventListener('input', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      state.gradientEnd = e.target.value;
      $('gradientEnd').value = e.target.value;
      renderWithBackground();
    }
  });
  $('gradientAngle').addEventListener('input', e => {
    state.gradientAngle = parseInt(e.target.value);
    $('gradientAngleValue').textContent = e.target.value + '°';
    renderWithBackground();
  });

  $('clearBtn').addEventListener('click', () => onClear?.());
  $('cropBtn').addEventListener('click', () => onCrop?.());
  $('exportBtn').addEventListener('click', () => onExport?.());
}
