export const state = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  zoom: 1,
  history: [],
  historyIndex: -1,
  imageLoaded: false,
  cropMode: false,
  cropRect: { x: 0, y: 0, w: 0, h: 0 },
  isPickingColor: false,
  bgType: 'transparent',
  bgColor: '#ffffff',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  gradientAngle: 135,
  originalImageData: null,
  images: [],
  currentImageIndex: -1,
  selectedImages: []
};

export const setState = (partial) => {
  Object.assign(state, partial);
};
