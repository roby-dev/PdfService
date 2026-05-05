import { Injectable } from '@angular/core';

declare global {
  interface Window {
    Sortable: any;
  }
}

@Injectable({ providedIn: 'root' })
export class SortableService {
  private loaded: Promise<any> | null = null;

  load(): Promise<any> {
    if (this.loaded) return this.loaded;

    this.loaded = new Promise((resolve, reject) => {
      const lib = (window as any).Sortable;
      if (lib) {
        resolve(lib);
        return;
      }
      const script = document.createElement('script');
      script.src = '/lib/Sortable.min.js';
      script.onload = () => resolve((window as any).Sortable);
      script.onerror = () => reject(new Error('No se pudo cargar Sortable.js'));
      document.head.appendChild(script);
    });

    return this.loaded;
  }

  create(el: HTMLElement, options: any): any {
    return new (window as any).Sortable(el, options);
  }
}
