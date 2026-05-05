import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bottom-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-0 left-0 right-0 bg-white py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-center items-center gap-4 z-50">
      <ng-content />
    </div>
  `,
})
export class BottomBarComponent {}
