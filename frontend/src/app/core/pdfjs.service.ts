import { Injectable } from '@angular/core';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

@Injectable({ providedIn: 'root' })
export class PdfjsService {
  private loaded: Promise<any> | null = null;

  load(): Promise<any> {
    if (this.loaded) return this.loaded;

    this.loaded = new Promise((resolve, reject) => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.min.js';
        resolve(lib);
        return;
      }

      const script = document.createElement('script');
      script.src = '/lib/pdf.min.js';
      script.onload = () => {
        const loaded = (window as any).pdfjsLib;
        loaded.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.min.js';
        resolve(loaded);
      };
      script.onerror = () => reject(new Error('No se pudo cargar PDF.js'));
      document.head.appendChild(script);
    });

    return this.loaded;
  }

  async renderPageToCanvas(arrayBuffer: ArrayBuffer, pageNumber: number, scale = 0.45): Promise<HTMLCanvasElement> {
    const lib = await this.load();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas;
  }

  async openDocument(arrayBuffer: ArrayBuffer): Promise<any> {
    const lib = await this.load();
    return lib.getDocument({ data: arrayBuffer }).promise;
  }
}
