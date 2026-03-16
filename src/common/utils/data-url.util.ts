export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = Buffer.from(base64, 'base64');
  return new Blob([bytes], { type: mimeType });
}
