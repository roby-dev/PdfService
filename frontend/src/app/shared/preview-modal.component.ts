import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-preview-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-xs p-4"
      (click)="close.emit()"
    >
      <div
        class="bg-white rounded-2xl w-[90vw] max-w-[1000px] max-h-[90vh] p-4 shadow-2xl relative flex flex-col items-center"
        (click)="$event.stopPropagation()"
      >
        <button
          type="button"
          class="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-md border-0 transition text-lg font-bold"
          (click)="close.emit()"
          aria-label="Cerrar vista previa"
        >
          ×
        </button>

        <div class="text-sm font-semibold text-neutral-700 mb-3 truncate max-w-full text-center px-4">
          {{ title() }}
        </div>

        <div class="w-full flex-1 overflow-hidden flex items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 p-4 min-h-0">
          <img
            [src]="imageUrl()"
            alt="Vista previa"
            class="max-w-full max-h-[80vh] object-contain transition-transform"
            [style.transform]="rotation()"
          />
        </div>
      </div>
    </div>
  `
})
export class PreviewModalComponent {
  readonly imageUrl = input.required<string>();
  readonly title = input<string>('Vista previa');
  readonly rotation = input<string>('');

  readonly close = output<void>();
}
