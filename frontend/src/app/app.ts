import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="w-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] py-4 text-center mb-8">
      <h1 class="text-brand text-3xl font-bold m-0">Servicio PDF - CMACT</h1>
      <nav class="flex justify-center gap-8 mt-2">
        <a
          routerLink="/"
          routerLinkActive="text-brand bg-brand-soft font-semibold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-neutral-500 text-sm font-medium px-3 py-1 rounded-full hover:text-brand hover:bg-brand-soft transition"
        >
          Unir PDFs
        </a>
        <a
          routerLink="/eliminar"
          routerLinkActive="text-brand bg-brand-soft font-semibold"
          class="text-neutral-500 text-sm font-medium px-3 py-1 rounded-full hover:text-brand hover:bg-brand-soft transition"
        >
          Eliminar Páginas
        </a>
        <a
          routerLink="/reordenar"
          routerLinkActive="text-brand bg-brand-soft font-semibold"
          class="text-neutral-500 text-sm font-medium px-3 py-1 rounded-full hover:text-brand hover:bg-brand-soft transition"
        >
          Reordenar y Rotar
        </a>
        <a
          routerLink="/markdown"
          routerLinkActive="text-brand bg-brand-soft font-semibold"
          class="text-neutral-500 text-sm font-medium px-3 py-1 rounded-full hover:text-brand hover:bg-brand-soft transition"
        >
          PDF a Markdown
        </a>
      </nav>
    </header>

    <main class="flex flex-col items-center min-h-[calc(100vh-200px)]">
      <router-outlet />
    </main>
  `,
})
export class App { }
