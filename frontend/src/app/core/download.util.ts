export function triggerDownload(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}

export function revokeUrl(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}
