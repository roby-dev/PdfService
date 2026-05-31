import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bottom-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-0 left-0 right-0 bg-white py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center gap-2 z-50 border-t border-neutral-100 animate-slide-up">
      <div class="text-[11px] text-neutral-400 flex items-center gap-1 font-medium select-none">
        <span>🔒</span>
        <span>Privacidad garantizada: Los archivos se procesan en memoria y se descartan de inmediato.</span>
      </div>
      <div class="flex justify-center items-center gap-4 w-full px-4">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `
})
export class BottomBarComponent {}
