import { Routes } from '@angular/router';

import { HomePage } from './pages/home/home.page';
import { WatchlistPage } from './pages/watchlist/watchlist.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'watchlist', component: WatchlistPage },
  { path: '**', redirectTo: '' },
];
