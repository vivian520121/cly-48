import { state } from '../core/state.js';

export function floodFillRemoveBg(targetR, targetG, targetB, tolerance, feather) {
  const { canvas, ctx } = state;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;
  
  const tol2 = tolerance * tolerance * 3;
  const visited = new Uint8Array(w * h);
  const mask = new Uint8Array(w * h);
  
  const queue = [];
  for (let x = 0; x < w; x++) {
    queue.push([x, 0]);
    queue.push([x, h - 1]);
  }
  for (let y = 0; y < h; y++) {
    queue.push([0, y]);
    queue.push([w - 1, y]);
  }
  
  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const idx = y * w + x;
    
    if (x < 0 || x >= w || y < 0 || y >= h || visited[idx]) continue;
    visited[idx] = 1;
    
    const p = idx * 4;
    const dr = data[p] - targetR;
    const dg = data[p + 1] - targetG;
    const db = data[p + 2] - targetB;
    const dist2 = dr * dr + dg * dg + db * db;
    
    if (dist2 <= tol2) {
      mask[idx] = 1;
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
  
  if (feather > 0) {
    const tempMask = new Uint8Array(mask);
    const r = feather;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (mask[idx] === 1) continue;
        
        let count = 0;
        let total = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              total++;
              if (tempMask[ny * w + nx] === 1) count++;
            }
          }
        }
        if (count / total > 0.5) mask[idx] = 2;
      }
    }
  }
  
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 0) {
      const p = i * 4;
      if (feather > 0 && mask[i] === 2) {
        data[p + 3] = Math.max(0, data[p + 3] - 128);
      } else {
        data[p + 3] = 0;
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}
