import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ToMarkdownResponse {
  markdown: string;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class PdfApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  merge(files: File[]): Observable<Blob> {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    return this.http.post(`${this.base}/merge`, form, { responseType: 'blob' });
  }

  deletePages(file: File, pages: number[]): Observable<Blob> {
    const form = new FormData();
    form.append('file', file);
    form.append('pages', JSON.stringify(pages));
    return this.http.post(`${this.base}/delete-pages`, form, { responseType: 'blob' });
  }

  reorderRotate(file: File, order: number[], rotations: Record<number, number>): Observable<Blob> {
    const form = new FormData();
    form.append('file', file);
    form.append('order', JSON.stringify(order));
    form.append('rotations', JSON.stringify(rotations));
    return this.http.post(`${this.base}/reorder-rotate`, form, { responseType: 'blob' });
  }

  toMarkdown(file: File): Observable<ToMarkdownResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ToMarkdownResponse>(`${this.base}/to-markdown`, form);
  }
}
