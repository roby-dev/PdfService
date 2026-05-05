import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/merge/merge.page').then((m) => m.MergePage),
    title: 'Unir PDFs',
  },
  {
    path: 'eliminar',
    loadComponent: () => import('./features/delete-pages/delete-pages.page').then((m) => m.DeletePagesPage),
    title: 'Eliminar Páginas',
  },
  {
    path: 'reordenar',
    loadComponent: () => import('./features/reorder-rotate/reorder-rotate.page').then((m) => m.ReorderRotatePage),
    title: 'Reordenar y Rotar',
  },
  { path: '**', redirectTo: '' },
];
