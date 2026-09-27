import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../core/api.service';
import { DEMO_WATCHLIST } from '../../core/demo-data';
import { WatchlistItem, WatchlistStatus } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-watchlist-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './watchlist.page.html',
  styleUrl: './watchlist.page.scss',
})
export class WatchlistPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly ratings = [6, 7, 8, 9, 10];
  statusFilter: WatchlistStatus | '' = '';
  sort = '-created_at';
  loading = signal(false);
  demoMode = signal(false);
  items = signal<WatchlistItem[]>([]);
  total = signal(0);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api
      .getWatchlist({
        status: this.statusFilter || undefined,
        sort: this.sort,
        page: 1,
        page_size: 50,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        this.loading.set(false);
        if (page) {
          this.demoMode.set(false);
          this.items.set(page.items);
          this.total.set(page.total);
          return;
        }
        this.demoMode.set(true);
        const demo = this.applyLocalFilters(DEMO_WATCHLIST);
        this.items.set(demo);
        this.total.set(demo.length);
        this.toast.info('API offline — lista de demonstração.');
      });
  }

  setFilter(status: WatchlistStatus | ''): void {
    this.statusFilter = status;
    this.reload();
  }

  changeStatus(item: WatchlistItem, status: WatchlistStatus): void {
    this.api
      .updateItem(item.id, { status })
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        if (updated) {
          this.patch(updated);
          this.toast.success('Status atualizado.');
          return;
        }
        this.patch({ ...item, status });
        this.toast.info('PUT simulado no protótipo (API offline).');
      });
  }

  changeRating(item: WatchlistItem, rating: number): void {
    this.api
      .updateItem(item.id, { rating })
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        if (updated) {
          this.patch(updated);
          this.toast.success('Nota salva.');
          return;
        }
        this.patch({ ...item, rating });
        this.toast.info('PUT simulado no protótipo (API offline).');
      });
  }

  remove(item: WatchlistItem): void {
    this.api
      .deleteItem(item.id)
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      )
      .subscribe((ok) => {
        this.items.update((list) => list.filter((row) => row.id !== item.id));
        this.total.update((value) => Math.max(0, value - 1));
        this.toast.success(
          ok === false ? 'DELETE simulado no protótipo (API offline).' : `${item.title} removido.`,
        );
      });
  }

  private patch(updated: WatchlistItem): void {
    this.items.update((list) => list.map((row) => (row.id === updated.id ? updated : row)));
  }

  private applyLocalFilters(source: WatchlistItem[]): WatchlistItem[] {
    let rows = [...source];
    if (this.statusFilter) {
      rows = rows.filter((row) => row.status === this.statusFilter);
    }
    const desc = this.sort.startsWith('-');
    const key = this.sort.replace('-', '') as 'created_at' | 'title' | 'rating';
    rows.sort((a, b) => {
      const av = String(a[key] ?? '');
      const bv = String(b[key] ?? '');
      return desc ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    return rows;
  }
}
