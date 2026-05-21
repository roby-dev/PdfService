import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UploadAreaComponent } from '../../shared/upload-area.component';
import { BottomBarComponent } from '../../shared/bottom-bar.component';
import { PdfApiService } from '../../core/pdf-api.service';

@Component({
  selector: 'app-to-markdown-page',
  imports: [UploadAreaComponent, BottomBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-[90%] max-w-[1000px] flex flex-col items-center grow">
      @if (!markdownResult()) {
        <app-upload-area
          buttonLabel="Seleccionar archivo"
          hint="o arrastra y suelta un archivo aquí"
          [accept]="acceptedExtensions"
          [multiple]="false"
          (filesSelected)="onFileSelected($event)"
        />

        @if (selectedFile()) {
          <div class="w-full max-w-[900px] bg-white rounded-xl shadow-md p-5 mb-8 flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-brand-softer flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-brand">
                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-800 truncate m-0">{{ selectedFile()!.name }}</p>
              <p class="text-xs text-neutral-400 m-0 mt-0.5">{{ formatSize(selectedFile()!.size) }}</p>
            </div>
            <button
              type="button"
              class="text-neutral-400 hover:text-red-500 transition p-1"
              (click)="clearFile()"
              aria-label="Quitar archivo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        }
      } @else {
        <!-- Result view -->
        <div class="w-full max-w-[900px] flex flex-col gap-4 mb-24">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-800 m-0">
              Resultado — {{ filename() }}
            </h2>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-sm font-medium px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                (click)="downloadAsFile()"
              >
                ↓ Descargar .md
              </button>
              <button
                type="button"
                class="text-sm font-medium px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover transition"
                (click)="copyToClipboard()"
              >
                {{ copyLabel() }}
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="flex border-b border-neutral-100">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium transition"
                [class.text-brand]="activeTab() === 'raw'"
                [class.border-b-2]="activeTab() === 'raw'"
                [class.border-brand]="activeTab() === 'raw'"
                [class.text-neutral-500]="activeTab() !== 'raw'"
                (click)="activeTab.set('raw')"
              >
                Markdown (raw)
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium transition"
                [class.text-brand]="activeTab() === 'preview'"
                [class.border-b-2]="activeTab() === 'preview'"
                [class.border-brand]="activeTab() === 'preview'"
                [class.text-neutral-500]="activeTab() !== 'preview'"
                (click)="activeTab.set('preview')"
              >
                Vista previa
              </button>
            </div>

            @if (activeTab() === 'raw') {
              <pre class="p-5 m-0 text-sm text-neutral-700 font-mono whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto leading-relaxed bg-neutral-50">{{ markdownResult() }}</pre>
            } @else {
              <div
                class="p-5 prose prose-sm max-w-none max-h-[60vh] overflow-y-auto"
                [innerHTML]="renderedHtml()"
              ></div>
            }
          </div>
        </div>

        <app-bottom-bar>
          <button
            type="button"
            class="bg-neutral-800 text-white text-lg px-10 py-3 rounded-full font-semibold shadow-lg hover:bg-black hover:-translate-y-0.5 transition"
            (click)="reset()"
          >
            Convertir otro archivo
          </button>
        </app-bottom-bar>
      }

      @if (!markdownResult()) {
        <div class="h-16"></div>
        <app-bottom-bar>
          <button
            type="button"
            class="bg-neutral-800 text-white text-lg px-10 py-3 rounded-full font-semibold shadow-lg hover:bg-black hover:-translate-y-0.5 transition disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none"
            [disabled]="!selectedFile() || processing()"
            (click)="convert()"
          >
            {{ processing() ? 'Convirtiendo…' : 'Convertir a Markdown' }}
          </button>
        </app-bottom-bar>
      }
    </div>
  `,
})
export class ToMarkdownPage {
  protected readonly acceptedExtensions = '.pdf,.docx,.pptx,.xlsx,.xls,.html,.htm,.csv,.json,.xml,.zip,.jpg,.jpeg,.png,.wav,.mp3';
  private readonly api = inject(PdfApiService);

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly processing = signal(false);
  protected readonly markdownResult = signal<string | null>(null);
  protected readonly filename = signal('');
  protected readonly copyLabel = signal('📋 Copiar');
  protected readonly activeTab = signal<'raw' | 'preview'>('raw');

  protected readonly renderedHtml = signal('');

  private readonly allowedExtensions = new Set([
    '.pdf', '.docx', '.pptx', '.xlsx', '.xls',
    '.html', '.htm', '.csv', '.json', '.xml', '.zip',
    '.jpg', '.jpeg', '.png', '.wav', '.mp3',
  ]);

  protected onFileSelected(files: File[]): void {
    const file = files[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.has(ext)) {
      alert('Formato no soportado. Formatos aceptados: PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, ZIP, imágenes y audio.');
      return;
    }
    this.selectedFile.set(file);
  }

  protected clearFile(): void {
    this.selectedFile.set(null);
  }

  protected convert(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.processing.set(true);
    this.api.toMarkdown(file).subscribe({
      next: (res) => {
        this.markdownResult.set(res.markdown);
        this.filename.set(res.filename ?? file.name);
        this.renderedHtml.set(this.markdownToHtml(res.markdown));
        this.processing.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al convertir el archivo.');
        this.processing.set(false);
      },
    });
  }

  protected async copyToClipboard(): Promise<void> {
    const md = this.markdownResult();
    if (!md) return;

    try {
      await navigator.clipboard.writeText(md);
      this.copyLabel.set('✅ ¡Copiado!');
      setTimeout(() => this.copyLabel.set('📋 Copiar'), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = md;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      this.copyLabel.set('✅ ¡Copiado!');
      setTimeout(() => this.copyLabel.set('📋 Copiar'), 2000);
    }
  }

  protected downloadAsFile(): void {
    const md = this.markdownResult();
    if (!md) return;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = (this.filename() || 'document').replace(/\.[^.\\/]+$/, '') || 'document';
    a.href = url;
    a.download = baseName + '.md';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  protected reset(): void {
    this.selectedFile.set(null);
    this.markdownResult.set(null);
    this.filename.set('');
    this.copyLabel.set('📋 Copiar');
    this.activeTab.set('raw');
    this.renderedHtml.set('');
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Minimal markdown→HTML for preview. Handles headings, bold, italic,
   * code blocks, inline code, lists, horizontal rules, and paragraphs.
   * Good enough for a quick preview — not a full parser.
   */
  private markdownToHtml(md: string): string {
    let html = md
      // Code blocks (fenced)
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Headings
      .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
      .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
      .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
      // Horizontal rules
      .replace(/^---+$/gm, '<hr>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Unordered lists
      .replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>')
      // Line breaks → paragraphs
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    // Clean up empty <p> tags
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }
}
