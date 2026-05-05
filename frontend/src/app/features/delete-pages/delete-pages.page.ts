import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UploadAreaComponent } from '../../shared/upload-area.component';
import { SuccessScreenComponent } from '../../shared/success-screen.component';
import { BottomBarComponent } from '../../shared/bottom-bar.component';
import { PdfApiService } from '../../core/pdf-api.service';
import { PdfjsService } from '../../core/pdfjs.service';
import { revokeUrl, triggerDownload } from '../../core/download.util';

interface PageThumb {
  pageNumber: number;
  thumbDataUrl: string;
}

@Component({
  selector: 'app-delete-pages-page',
  imports: [UploadAreaComponent, SuccessScreenComponent, BottomBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showSuccess()) {
      <app-success-screen
        title="¡Perfecto!"
        description="Tu PDF con las páginas eliminadas se ha descargado correctamente."
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
            Haz clic en las páginas que quieras <strong class="text-brand">eliminar</strong>
          </div>
        }

        @if (loading()) {
          <div class="flex flex-col items-center gap-4 p-8">
            <div class="w-10 h-10 border-4 border-neutral-200 border-t-brand rounded-full animate-spin"></div>
            <span class="text-neutral-500">Cargando páginas...</span>
          </div>
        }

        @if (pages().length > 0) {
          <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 w-full mb-8">
            @for (p of pages(); track p.pageNumber) {
              <div
                class="bg-white rounded-xl shadow-md p-2.5 flex flex-col items-center relative cursor-pointer transition select-none hover:-translate-y-0.5 hover:shadow-lg"
                [class.border-2]="selected().has(p.pageNumber)"
                [class.border-brand]="selected().has(p.pageNumber)"
                (click)="togglePage(p.pageNumber)"
              >
                <img
                  [src]="p.thumbDataUrl"
                  [alt]="'Página ' + p.pageNumber"
                  class="max-w-full h-auto border border-neutral-200 rounded mb-2 bg-neutral-50 transition-opacity"
                  [class.opacity-35]="selected().has(p.pageNumber)"
                />
                @if (selected().has(p.pageNumber)) {
                  <div class="absolute top-2.5 left-2.5 right-2.5 bottom-8 bg-brand/10 rounded flex items-center justify-center pointer-events-none">
                    <div class="w-12 h-12 rounded-full bg-brand flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </div>
                }
                <div class="text-sm text-neutral-600 font-medium">Página {{ p.pageNumber }}</div>
              </div>
            }
          </div>
        }

        <div class="h-16"></div>
      </div>

      @if (file()) {
        <app-bottom-bar>
          <button
            type="button"
            class="bg-neutral-800 text-white text-base px-9 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2.5 hover:bg-brand hover:-translate-y-0.5 transition disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none"
            [disabled]="!canDelete() || processing()"
            (click)="deletePages()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>{{ processing() ? 'Eliminando...' : 'Eliminar páginas' }}</span>
          </button>
          <span class="font-medium text-neutral-600 text-sm">{{ status() }}</span>
        </app-bottom-bar>
      }
    }
  `,
})
export class DeletePagesPage {
  private readonly api = inject(PdfApiService);
  private readonly pdfjs = inject(PdfjsService);

  protected readonly file = signal<File | null>(null);
  protected readonly pages = signal<PageThumb[]>([]);
  protected readonly selected = signal<Set<number>>(new Set());
  protected readonly loading = signal(false);
  protected readonly processing = signal(false);
  protected readonly showSuccess = signal(false);

  protected readonly canDelete = computed(() => {
    const sel = this.selected().size;
    const total = this.pages().length;
    return sel > 0 && sel < total;
  });

  protected readonly status = computed(() => {
    const n = this.selected().size;
    const total = this.pages().length;
    if (n === 0) return 'Selecciona páginas para eliminar';
    if (n >= total) return 'Debes conservar al menos 1 página';
    return n === 1 ? '1 página seleccionada' : `${n} páginas seleccionadas`;
  });

  private lastDownloadUrl: string | null = null;
  private lastDownloadName = 'editado.pdf';

  protected async loadFile(files: File[]): Promise<void> {
    const file = files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }

    this.file.set(file);
    this.selected.set(new Set());
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
    } catch (err) {
      console.error(err);
      alert('Error al cargar el PDF.');
      this.file.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  protected togglePage(pageNum: number): void {
    const set = new Set(this.selected());
    if (set.has(pageNum)) {
      set.delete(pageNum);
    } else {
      if (set.size >= this.pages().length - 1) {
        alert('Debes conservar al menos una página.');
        return;
      }
      set.add(pageNum);
    }
    this.selected.set(set);
  }

  protected deletePages(): void {
    const file = this.file();
    if (!file || this.selected().size === 0) return;

    this.processing.set(true);
    this.api.deletePages(file, [...this.selected()]).subscribe({
      next: (blob) => {
        const name = file.name.replace(/\.pdf$/i, '') + '_editado.pdf';
        revokeUrl(this.lastDownloadUrl);
        this.lastDownloadUrl = triggerDownload(blob, name);
        this.lastDownloadName = name;
        this.processing.set(false);
        this.showSuccess.set(true);
      },
      error: (err) => {
        console.error(err);
        alert('Error al eliminar las páginas.');
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
    this.selected.set(new Set());
    this.showSuccess.set(false);
  }
}
