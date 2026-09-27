import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../core/api.service';
import { DEMO_RECOMMENDATION } from '../../core/demo-data';
import { MovieCard, RecommendationResponse } from '../../core/models';
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
  approximateLocation = signal(false);
  data = signal<RecommendationResponse | null>(null);
  savingId = signal<number | null>(null);

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
    this.fetch({ city });
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
      .pipe(catchError(() => of(null)))
      .subscribe((item) => {
        this.savingId.set(null);
        if (item) {
          this.toast.success(`${movie.title} entrou na sua lista.`);
        } else {
          this.toast.info('API offline — o filme foi marcado só neste protótipo.');
        }
      });
  }

  weatherIcon(icon: string | null): string {
    return icon
      ? `https://openweathermap.org/img/wn/${icon}@2x.png`
      : 'https://openweathermap.org/img/wn/10d@2x.png';
  }

  private fetch(query: { city?: string; lat?: number; lon?: number }): void {
    this.loading.set(true);
    this.api
      .getRecommendations(query)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        this.loading.set(false);
        if (response) {
          this.demoMode.set(false);
          this.data.set(response);
          this.city = response.weather.city || this.city;
          return;
        }
        this.demoMode.set(true);
        this.data.set(DEMO_RECOMMENDATION);
        this.toast.info('API offline — mostrando o protótipo com dados de demonstração.');
      });
  }
}
