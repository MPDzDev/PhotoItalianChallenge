export async function compressImage(file, maxBytes = 200000, mime = 'image/jpeg') {
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    image.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  let quality = 0.9;
  let blob = await new Promise((r) => canvas.toBlob(r, mime, quality));
  while (blob && blob.size > maxBytes && quality > 0.1) {
    quality -= 0.1;
    blob = await new Promise((r) => canvas.toBlob(r, mime, quality));
  }
  return new File([blob], file.name, { type: mime });
}
