export interface ArtCrop { focusX: number; focusY: number; zoom: number }

// Scale around the focal point so 0/100 reaches the actual image edge even at zoom > 1.
export const cropStyle = (crop: ArtCrop) => ({
  objectFit: 'cover' as const,
  objectPosition: `${crop.focusX}% ${crop.focusY}%`,
  transform: `scale(${crop.zoom})`,
  transformOrigin: `${crop.focusX}% ${crop.focusY}%`,
});
