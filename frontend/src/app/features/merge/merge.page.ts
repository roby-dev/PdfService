import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { UploadAreaComponent } from '../../shared/upload-area.component';
import { SuccessScreenComponent } from '../../shared/success-screen.component';
import { BottomBarComponent } from '../../shared/bottom-bar.component';
import { PdfApiService } from '../../core/pdf-api.service';
import { PdfjsService } from '../../core/pdfjs.service';
import { SortableService } from '../../core/sortable.service';
import { revokeUrl, triggerDownload } from '../../core/download.util';

interface PdfItem {
  id: string;
  file: File;
  thumbDataUrl: string | null;
  loading: boolean;
}

@Component({
  selector: 'app-merge-page',
  imports: [UploadAreaComponent, SuccessScreenComponent, BottomBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showSuccess()) {
      <app-success-screen
        title="¡Perfecto!"
        description="Tu archivo PDF unido se ha descargado correctamente."
        restartLabel="Volver a unir"
        (downloadAgain)="downloadAgain()"
        (restart)="reset()"
      />
    } @else {
      <div class="w-[90%] max-w-[1000px] flex flex-col items-center grow">
        <app-upload-area
          buttonLabel="Seleccionar archivos PDF"
          hint="o arrastra y suelta los PDFs aquí"
          [multiple]="true"
          (filesSelected)="addFiles($event)"
        />

        <div #grid class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 w-full mb-8">
          @for (item of items(); track item.id) {
            <div
              [attr.data-id]="item.id"
              class="bg-white rounded-xl shadow-md p-2.5 flex flex-col items-center relative cursor-grab active:cursor-grabbing transition group"
            >
              @if (item.loading) {
                <div class="w-[150px] h-[200px] bg-neutral-100 flex items-center justify-center mb-2.5 rounded">
                  <span class="text-neutral-400 text-sm">Cargando...</span>
                </div>
              } @else if (item.thumbDataUrl) {
                <img [src]="item.thumbDataUrl" [alt]="item.file.name" class="max-w-full h-auto border border-neutral-200 rounded mb-2.5 bg-neutral-50" />
              } @else {
                <div class="w-[150px] h-[200px] bg-neutral-100 flex items-center justify-center mb-2.5 rounded">
                  <span class="text-red-500 text-2xl font-bold">PDF</span>
                </div>
              }
              <div class="text-sm text-center text-neutral-600 w-full break-words line-clamp-2" [title]="item.file.name">
                {{ item.file.name }}
              </div>
              <button
                type="button"
                class="absolute -top-2 -right-2 bg-red-500 text-white border-0 rounded-full w-6 h-6 text-sm cursor-pointer flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                (click)="removeFile(item.id)"
                aria-label="Quitar archivo"
              >
                ×
              </button>
            </div>
          }
        </div>

        <div class="h-16"></div>
      </div>

      <app-bottom-bar>
        <button
          type="button"
          class="bg-neutral-800 text-white text-lg px-10 py-3 rounded-full font-semibold shadow-lg hover:bg-black hover:-translate-y-0.5 transition disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none"
          [disabled]="!canMerge() || processing()"
          (click)="merge()"
        >
          {{ processing() ? 'Uniendo...' : 'Unir PDF' }}
        </button>
        <span class="ml-5 font-medium">{{ status() }}</span>
      </app-bottom-bar>
    }
  `,
})
export class MergePage {
  private readonly api = inject(PdfApiService);
  private readonly pdfjs = inject(PdfjsService);
  private readonly sortableLoader = inject(SortableService);

  protected readonly items = signal<PdfItem[]>([]);
  protected readonly processing = signal(false);
  protected readonly showSuccess = signal(false);

  protected readonly canMerge = computed(() => this.items().length >= 2);
  protected readonly status = computed(() => {
    const n = this.items().length;
    if (n >= 2) return `${n} archivos seleccionados`;
    return 'Selecciona al menos 2 archivos';
  });

  private readonly grid = viewChild<ElementRef<HTMLDivElement>>('grid');
  private sortableInstance: any = null;
  private lastDownloadUrl: string | null = null;
  private counter = 0;

  protected async addFiles(files: File[]): Promise<void> {
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF: ' + file.name);
        continue;
      }
      const id = 'file-' + this.counter++;
      this.items.update((list) => [...list, { id, file, thumbDataUrl: null, loading: true }]);

      this.generateThumbnail(id, file);
    }

    queueMicrotask(() => this.initSortable());
  }

  private async generateThumbnail(id: string, file: File): Promise<void> {
    try {
      const buf = await file.arrayBuffer();
      const canvas = await this.pdfjs.renderPageToCanvas(buf, 1, 0.5);
      const dataUrl = canvas.toDataURL('image/png');
      this.items.update((list) =>
        list.map((it) => (it.id === id ? { ...it, thumbDataUrl: dataUrl, loading: false } : it)),
      );
    } catch (err) {
      console.error('Error generating thumbnail', err);
      this.items.update((list) => list.map((it) => (it.id === id ? { ...it, loading: false } : it)));
    }
  }

  private async initSortable(): Promise<void> {
    const gridEl = this.grid()?.nativeElement;
    if (!gridEl || this.sortableInstance) return;

    await this.sortableLoader.load();
    this.sortableInstance = this.sortableLoader.create(gridEl, {
      animation: 150,
      ghostClass: 'opacity-40',
    });
  }

  protected removeFile(id: string): void {
    this.items.update((list) => list.filter((it) => it.id !== id));
  }

  protected merge(): void {
    if (!this.canMerge()) return;

    const gridEl = this.grid()?.nativeElement;
    let orderedFiles: File[];

    if (gridEl) {
      const ids = Array.from(gridEl.querySelectorAll<HTMLElement>('[data-id]')).map((el) => el.dataset['id']!);
      const map = new Map(this.items().map((it) => [it.id, it.file]));
      orderedFiles = ids.map((id) => map.get(id)!).filter(Boolean);
    } else {
      orderedFiles = this.items().map((it) => it.file);
    }

    this.processing.set(true);
    this.api.merge(orderedFiles).subscribe({
      next: (blob) => {
        revokeUrl(this.lastDownloadUrl);
        this.lastDownloadUrl = triggerDownload(blob, 'documento_unido.pdf');
        this.processing.set(false);
        this.showSuccess.set(true);
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al unir los archivos.');
        this.processing.set(false);
      },
    });
  }

  protected downloadAgain(): void {
    if (this.lastDownloadUrl) {
      const a = document.createElement('a');
      a.href = this.lastDownloadUrl;
      a.download = 'documento_unido.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  protected reset(): void {
    revokeUrl(this.lastDownloadUrl);
    this.lastDownloadUrl = null;
    this.items.set([]);
    this.counter = 0;
    this.showSuccess.set(false);
    this.sortableInstance?.destroy();
    this.sortableInstance = null;
  }
}
