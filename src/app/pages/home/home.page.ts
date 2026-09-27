import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeoutError, catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { ApiService } from '../../core/api.service';
import { DEMO_RECOMMENDATION } from '../../core/demo-data';
import { MovieCard, PlaceSuggestion, RecommendationResponse } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-home-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatAutocompleteModule,
    DecimalPipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  city = 'São Paulo';
  loading = signal(false);
  demoMode = signal(false);
  loadError = signal<string | null>(null);
  approximateLocation = signal(false);
  data = signal<RecommendationResponse | null>(null);
  savingId = signal<number | null>(null);
  places = signal<PlaceSuggestion[]>([]);
  private suggestTimer: ReturnType<typeof setTimeout> | null = null;
  private fetchId = 0;
  private suggestId = 0;
  private lockedQuery: string | null = null;

  ngOnInit(): void {
    this.loadByCity();
  }

  loadByCity(): void {
    const city = this.city.trim();
    if (!city) {
      this.toast.error('Informe uma cidade.');
      return;
    }
    this.approximateLocation.set(false);
    this.places.set([]);
    if (this.lockedQuery && city === this.lockedQuery.split(',')[0]) {
      this.fetch({ city: this.lockedQuery }, city);
      return;
    }
    this.lockedQuery = null;
    this.fetch({ city });
  }

  onCityInput(): void {
    const query = this.city.trim();
    if (this.lockedQuery && query !== this.lockedQuery.split(',')[0]) {
      this.lockedQuery = null;
    }
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
    }
    if (query.length < 2) {
      this.places.set([]);
      return;
    }
    this.suggestTimer = setTimeout(() => this.loadSuggestions(query), 300);
  }

  placeLabel(place: PlaceSuggestion): string {
    return [place.name, place.state, place.country].filter(Boolean).join(', ');
  }

  selectPlace(event: MatAutocompleteSelectedEvent): void {
    const label = String(event.option.value);
    const place = this.places().find((item) => this.placeLabel(item) === label);
    if (!place) {
      return;
    }
    const cityQuery = place.state ? `${place.name},${place.state},BR` : place.name;
    this.lockedQuery = cityQuery;
    this.city = place.name;
    this.places.set([]);
    this.approximateLocation.set(false);
    if (place.lat != null && place.lon != null) {
      this.fetch({ lat: place.lat, lon: place.lon }, place.name);
      return;
    }
    this.fetch({ city: cityQuery }, place.name);
  }

  useLocation(): void {
    if (!navigator.geolocation) {
      this.toast.error('Geolocalização não disponível neste navegador.');
      return;
    }
    this.loading.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const approximate = pos.coords.accuracy > 3000;
        this.approximateLocation.set(approximate);
        this.fetch({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        if (approximate) {
          this.toast.info(
            'O navegador enviou uma localização aproximada. Se a cidade não for a sua, digite o nome e busque de novo.',
          );
        }
      },
      () => {
        this.loading.set(false);
        this.toast.error('Não foi possível obter a localização. Confira a permissão do navegador.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  save(movie: MovieCard): void {
    const current = this.data();
    this.savingId.set(movie.tmdb_id);
    this.api
      .saveMovie(
        this.api.toCreatePayload(
          movie,
          current?.weather.description,
          current?.weather.city,
        ),
      )
      .subscribe({
        next: () => {
          this.savingId.set(null);
          this.toast.success(`${movie.title} entrou na sua lista.`);
        },
        error: (error: unknown) => {
          this.savingId.set(null);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.toast.info('Esse filme já está na sua lista.');
            return;
          }
          const detail = this.apiDetail(error);
          if (detail) {
            this.toast.error(detail);
            return;
          }
          this.toast.info('API offline — o filme foi marcado só neste protótipo.');
        },
      });
  }

  weatherIcon(icon: string | null): string {
    return icon
      ? `https://openweathermap.org/img/wn/${icon}@2x.png`
      : 'https://openweathermap.org/img/wn/10d@2x.png';
  }

  private loadSuggestions(query: string): void {
    const id = ++this.suggestId;
    this.api
      .searchPlaces(query)
      .pipe(catchError(() => of([])))
      .subscribe((places) => {
        if (id !== this.suggestId || this.city.trim() !== query) {
          return;
        }
        this.places.set(places);
      });
  }

  private fetch(
    query: { city?: string; lat?: number; lon?: number },
    displayCity?: string,
  ): void {
    const id = ++this.fetchId;
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getRecommendations(query).subscribe({
      next: (response) => {
        if (id !== this.fetchId) {
          return;
        }
        this.loading.set(false);
        this.demoMode.set(false);
        this.loadError.set(null);
        if (displayCity) {
          response = {
            ...response,
            weather: { ...response.weather, city: displayCity },
          };
          this.city = displayCity;
        } else {
          this.city = response.weather.city || this.city;
        }
        this.data.set(response);
      },
      error: (error: unknown) => {
        if (id !== this.fetchId) {
          return;
        }
        this.loading.set(false);
        const detail = this.apiDetail(error);
        if (detail) {
          this.demoMode.set(false);
          this.data.set(null);
          this.loadError.set(detail);
          this.toast.error(detail);
          return;
        }
        this.loadError.set(null);
        this.demoMode.set(true);
        this.data.set(DEMO_RECOMMENDATION);
        this.toast.info('API offline — mostrando o protótipo com dados de demonstração.');
      },
    });
  }

  private apiDetail(error: unknown): string | null {
    if (error instanceof TimeoutError) {
      return null;
    }
    if (!(error instanceof HttpErrorResponse) || error.status === 0) {
      return null;
    }
    const body = error.error;
    if (body && typeof body === 'object') {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      if (Array.isArray(detail)) {
        const text = detail
          .map((item) =>
            item && typeof item === 'object' && 'msg' in item ? String(item.msg) : '',
          )
          .filter(Boolean)
          .join(' ');
        if (text) {
          return text;
        }
      }
    }
    if (error.status >= 400 && error.status < 500) {
      return `A API respondeu com erro ${error.status}.`;
    }
    return null;
  }
}
