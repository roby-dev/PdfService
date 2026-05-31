import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="w-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] py-4 text-center mb-8">
        <div class="flex items-center justify-center gap-3">
          <img src="assets/logo.png" alt="Logo" class="h-9 w-auto rounded-lg" />
          <h1 class="text-brand text-3xl font-bold m-0">Servicios PDF</h1>
        </div>
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
            A Markdown
          </a>
        </nav>
      </header>

      <main class="flex-grow flex flex-col items-center">
        <router-outlet />
      </main>

      <footer class="w-full text-center py-6 mt-8 text-neutral-400 text-xs border-t border-neutral-100 pb-28">
        <p class="font-medium text-neutral-500 mb-1">
          🔒 Privacidad garantizada: Los archivos se procesan en memoria y se eliminan inmediatamente tras finalizar la operación. No almacenamos tus documentos.
        </p>
        <p>© 2026 - Servicios PDF</p>
      </footer>
    </div>
  `,
})
export class App { }
