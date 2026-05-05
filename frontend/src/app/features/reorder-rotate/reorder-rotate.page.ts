import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { UploadAreaComponent } from '../../shared/upload-area.component';
import { SuccessScreenComponent } from '../../shared/success-screen.component';
import { BottomBarComponent } from '../../shared/bottom-bar.component';
import { PdfApiService } from '../../core/pdf-api.service';
import { PdfjsService } from '../../core/pdfjs.service';
import { SortableService } from '../../core/sortable.service';
import { revokeUrl, triggerDownload } from '../../core/download.util';

interface PageThumb {
  pageNumber: number;
  thumbDataUrl: string;
}

@Component({
  selector: 'app-reorder-rotate-page',
  imports: [UploadAreaComponent, SuccessScreenComponent, BottomBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showSuccess()) {
      <app-success-screen
        title="¡Listo!"
        description="Tu PDF reordenado y rotado se descargó correctamente."
        (downloadAgain)="downloadAgain()"
        (restart)="reset()"
      />
    } @else {
      <div class="w-[90%] max-w-[1000px] flex flex-col items-center grow">
        @if (!file()) {
          <app-upload-area
            buttonLabel="Seleccionar archivo PDF"
            hint="o arrastra y suelta un PDF aquí"
            (filesSelected)="loadFile($event)"
          />
        } @else {
          <div class="w-full flex justify-between items-center mb-4 flex-wrap gap-2">
            <div class="font-semibold text-neutral-700 text-sm flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-brand">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>{{ file()!.name }}</span>
            </div>
            <span class="text-neutral-500 text-sm">{{ pages().length }} páginas</span>
            <button
              type="button"
              class="border border-neutral-300 text-neutral-600 px-4 py-1.5 rounded-md text-xs font-medium hover:border-brand hover:text-brand transition"
              (click)="reset()"
            >
              Cambiar archivo
            </button>
          </div>

          <div class="w-full text-center py-2 px-4 bg-brand-soft rounded-lg text-neutral-500 text-sm mb-5">
            <strong class="text-brand">Arrastra</strong> las páginas para reordenar · Haz clic en
            <strong class="text-brand">↻</strong> para rotar 90°
          </div>
        }

        @if (loading()) {
          <div class="flex flex-col items-center gap-4 p-8">
            <div class="w-10 h-10 border-4 border-neutral-200 border-t-brand rounded-full animate-spin"></div>
            <span class="text-neutral-500">Cargando páginas...</span>
          </div>
        }

        @if (pages().length > 0) {
          <div #grid class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 w-full mb-8">
            @for (p of pages(); track p.pageNumber) {
              <div
                [attr.data-page]="p.pageNumber"
                class="bg-white rounded-xl shadow-md p-2.5 flex flex-col items-center relative cursor-grab active:cursor-grabbing transition select-none border-2 border-transparent hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div class="w-full overflow-hidden flex items-center justify-center min-h-[120px] border border-neutral-200 rounded bg-neutral-50 mb-2 relative">
                  <img
                    [src]="p.thumbDataUrl"
                    [alt]="'Página ' + p.pageNumber"
                    class="max-w-full h-auto block transition-transform duration-300"
                    [style.transform]="rotationStyle(p.pageNumber)"
                  />
                </div>
                <div class="flex items-center justify-between w-full gap-1">
                  <span class="text-xs text-neutral-600 font-medium whitespace-nowrap">Pág. {{ p.pageNumber }}</span>
                  <div class="flex items-center gap-1 shrink-0">
                    @if (rotations().get(p.pageNumber); as deg) {
                      @if (deg !== 0) {
                        <span class="text-[0.7rem] font-semibold text-brand bg-brand-soft px-1 py-0.5 rounded">{{ deg }}°</span>
                      }
                    }
                    <button
                      type="button"
                      class="bg-white/90 border border-neutral-300 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm hover:bg-white hover:border-brand hover:scale-110 transition"
                      (mousedown)="$event.stopPropagation()"
                      (click)="rotate($event, p.pageNumber)"
                      title="Rotar 90°"
                      aria-label="Rotar 90 grados"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-neutral-600">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <div class="h-16"></div>
      </div>

      @if (file() && pages().length > 0) {
        <app-bottom-bar>
          <button
            type="button"
            class="bg-neutral-800 text-white text-base px-9 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2.5 hover:bg-brand hover:-translate-y-0.5 transition disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none"
            [disabled]="processing()"
            (click)="apply()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{{ processing() ? 'Procesando...' : 'Descargar PDF' }}</span>
          </button>
          <span class="font-medium text-neutral-600 text-sm">{{ status() }}</span>
        </app-bottom-bar>
      }
    }
  `,
})
export class ReorderRotatePage {
  private readonly api = inject(PdfApiService);
  private readonly pdfjs = inject(PdfjsService);
  private readonly sortableLoader = inject(SortableService);

  protected readonly file = signal<File | null>(null);
  protected readonly pages = signal<PageThumb[]>([]);
  protected readonly rotations = signal<Map<number, number>>(new Map());
  protected readonly loading = signal(false);
  protected readonly processing = signal(false);
  protected readonly showSuccess = signal(false);

  private readonly grid = viewChild<ElementRef<HTMLDivElement>>('grid');
  private sortableInstance: any = null;
  private lastDownloadUrl: string | null = null;
  private lastDownloadName = 'reordenado.pdf';

  protected readonly status = computed(() => {
    let rotated = 0;
    this.rotations().forEach((d) => {
      if (d !== 0) rotated++;
    });
    if (rotated === 0) return 'Listo para descargar';
    return rotated === 1 ? '1 página rotada' : `${rotated} páginas rotadas`;
  });

  protected rotationStyle(pageNum: number): string {
    const deg = this.rotations().get(pageNum) || 0;
    if (deg === 0) return 'rotate(0deg)';
    if (deg === 90 || deg === 270) return `rotate(${deg}deg) scale(0.72)`;
    return `rotate(${deg}deg)`;
  }

  protected async loadFile(files: File[]): Promise<void> {
    const file = files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }

    this.file.set(file);
    this.rotations.set(new Map());
    this.pages.set([]);
    this.loading.set(true);

    try {
      const buf = await file.arrayBuffer();
      const doc = await this.pdfjs.openDocument(buf);
      const total = doc.numPages;
      const list: PageThumb[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        list.push({ pageNumber: i, thumbDataUrl: canvas.toDataURL('image/png') });
        this.pages.set([...list]);
      }

      queueMicrotask(() => this.initSortable());
    } catch (err) {
      console.error(err);
      alert('Error al cargar el PDF.');
      this.file.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async initSortable(): Promise<void> {
    const gridEl = this.grid()?.nativeElement;
    if (!gridEl || this.sortableInstance) return;
    await this.sortableLoader.load();
    this.sortableInstance = this.sortableLoader.create(gridEl, {
      animation: 150,
      ghostClass: 'opacity-35',
      chosenClass: 'shadow-2xl',
      dragClass: 'opacity-95',
    });
  }

  protected rotate(event: Event, pageNum: number): void {
    event.stopPropagation();
    const map = new Map(this.rotations());
    const current = map.get(pageNum) || 0;
    const next = (current + 90) % 360;
    if (next === 0) {
      map.delete(pageNum);
    } else {
      map.set(pageNum, next);
    }
    this.rotations.set(map);
  }

  protected apply(): void {
    const file = this.file();
    if (!file) return;

    const gridEl = this.grid()?.nativeElement;
    let order: number[];
    if (gridEl) {
      order = Array.from(gridEl.querySelectorAll<HTMLElement>('[data-page]')).map((el) =>
        parseInt(el.dataset['page']!, 10),
      );
    } else {
      order = this.pages().map((p) => p.pageNumber);
    }

    const rotations: Record<number, number> = {};
    this.rotations().forEach((deg, page) => {
      if (deg !== 0) rotations[page] = deg;
    });

    this.processing.set(true);
    this.api.reorderRotate(file, order, rotations).subscribe({
      next: (blob) => {
        const name = file.name.replace(/\.pdf$/i, '') + '_reordenado.pdf';
        revokeUrl(this.lastDownloadUrl);
        this.lastDownloadUrl = triggerDownload(blob, name);
        this.lastDownloadName = name;
        this.processing.set(false);
        this.showSuccess.set(true);
      },
      error: (err) => {
        console.error(err);
        alert('Error al procesar el PDF.');
        this.processing.set(false);
      },
    });
  }

  protected downloadAgain(): void {
    if (this.lastDownloadUrl) {
      const a = document.createElement('a');
      a.href = this.lastDownloadUrl;
      a.download = this.lastDownloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  protected reset(): void {
    revokeUrl(this.lastDownloadUrl);
    this.lastDownloadUrl = null;
    this.file.set(null);
    this.pages.set([]);
    this.rotations.set(new Map());
    this.showSuccess.set(false);
    this.sortableInstance?.destroy();
    this.sortableInstance = null;
  }
}
