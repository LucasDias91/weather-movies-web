import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';

import {
  MovieCard,
  PlaceSuggestion,
  RecommendationResponse,
  WatchlistCreate,
  WatchlistItem,
  WatchlistPage,
  WatchlistUpdate,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';
  private readonly requestTimeoutMs = 25000;

  getRecommendations(query: {
    city?: string;
    lat?: number;
    lon?: number;
  }): Observable<RecommendationResponse> {
    let params = new HttpParams();
    if (query.city) {
      params = params.set('city', query.city);
    }
    if (query.lat != null && query.lon != null) {
      params = params.set('lat', String(query.lat)).set('lon', String(query.lon));
    }
    return this.http
      .get<RecommendationResponse>(`${this.base}/recommendations`, { params })
      .pipe(timeout(this.requestTimeoutMs));
  }

  searchPlaces(query: string): Observable<PlaceSuggestion[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<PlaceSuggestion[]>(`${this.base}/locations`, { params })
      .pipe(timeout(this.requestTimeoutMs));
  }

  getWatchlist(query: {
    status?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  } = {}): Observable<WatchlistPage> {
    let params = new HttpParams();
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if (query.page) {
      params = params.set('page', String(query.page));
    }
    if (query.page_size) {
      params = params.set('page_size', String(query.page_size));
    }
    return this.http
      .get<WatchlistPage>(`${this.base}/watchlist`, { params })
      .pipe(timeout(this.requestTimeoutMs));
  }

  saveMovie(payload: WatchlistCreate): Observable<WatchlistItem> {
    return this.http
      .post<WatchlistItem>(`${this.base}/watchlist`, payload)
      .pipe(timeout(this.requestTimeoutMs));
  }

  updateItem(id: number, payload: WatchlistUpdate): Observable<WatchlistItem> {
    return this.http
      .put<WatchlistItem>(`${this.base}/watchlist/${id}`, payload)
      .pipe(timeout(this.requestTimeoutMs));
  }

  deleteItem(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/watchlist/${id}`)
      .pipe(timeout(this.requestTimeoutMs));
  }

  toCreatePayload(
    movie: MovieCard,
    weatherLabel?: string,
    city?: string,
  ): WatchlistCreate {
    return {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_url: movie.poster_url,
      genre: movie.genres.join(', ') || null,
      weather_label: weatherLabel ?? null,
      city: city ?? null,
      status: 'quero_assistir',
    };
  }
}
