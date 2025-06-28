export const previewCache = {};
export const fullCache = {};

export function cachePhoto(id, previewUrl, fullUrl) {
  if (previewUrl) previewCache[id] = previewUrl;
  if (fullUrl) fullCache[id] = fullUrl;
}

export function getPreview(id) {
  return previewCache[id];
}

export function getFull(id) {
  return fullCache[id];
}

export function removePhoto(id) {
  delete previewCache[id];
  delete fullCache[id];
}
