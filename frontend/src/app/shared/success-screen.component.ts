import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-success-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center py-12 px-8 grow">
      <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-green-600">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 class="text-2xl font-semibold text-neutral-800 mb-2">{{ title() }}</h2>
      <p class="text-neutral-500 text-sm mb-8 max-w-md">{{ description() }}</p>
      <button
        type="button"
        class="text-brand font-medium text-base mb-6 px-4 py-2 rounded-lg hover:bg-brand-soft transition"
        (click)="downloadAgain.emit()"
      >
        Si no se descargó, haz click aquí para descargar
      </button>
      <button
        type="button"
        class="bg-neutral-800 text-white px-9 py-3 rounded-full text-base font-semibold hover:bg-black hover:-translate-y-0.5 transition"
        (click)="restart.emit()"
      >
        {{ restartLabel() }}
      </button>
    </div>
  `,
})
export class SuccessScreenComponent {
  readonly title = input<string>('¡Perfecto!');
  readonly description = input<string>('Tu archivo se ha descargado correctamente.');
  readonly restartLabel = input<string>('Volver a empezar');

  readonly downloadAgain = output<void>();
  readonly restart = output<void>();
}
