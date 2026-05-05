import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-upload-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full max-w-[900px] border-2 border-dashed border-brand rounded-xl px-6 py-12 sm:px-12 text-center cursor-pointer transition mb-8"
      [class.bg-brand-soft]="dragOver()"
      [class.scale-[1.01]]="dragOver()"
      [class.bg-brand-softer]="!dragOver()"
      (click)="openPicker()"
      (dragenter)="onDragEnter($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <button
        type="button"
        class="bg-brand text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-brand-hover transition mb-2"
      >
        {{ buttonLabel() }}
      </button>
      <p class="m-0 mt-4 text-base text-neutral-600">{{ hint() }}</p>
      <input
        #fileEl
        type="file"
        class="hidden"
        [accept]="accept()"
        [multiple]="multiple()"
        (change)="onChange($event)"
      />
    </div>
  `,
})
export class UploadAreaComponent {
  readonly buttonLabel = input<string>('Seleccionar archivo PDF');
  readonly hint = input<string>('o arrastra y suelta un PDF aquí');
  readonly accept = input<string>('.pdf');
  readonly multiple = input<boolean>(false);

  readonly filesSelected = output<File[]>();

  protected readonly dragOver = signal(false);
  private readonly fileEl = viewChild.required<ElementRef<HTMLInputElement>>('fileEl');

  protected openPicker(): void {
    this.fileEl().nativeElement.click();
  }

  protected onDragEnter(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.filesSelected.emit(Array.from(files));
    }
  }

  protected onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesSelected.emit(Array.from(input.files));
      input.value = '';
    }
  }
}
