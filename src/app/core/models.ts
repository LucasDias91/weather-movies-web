export interface WeatherInfo {
  city: string;
  country: string | null;
  temperature_c: number;
  description: string;
  main: string;
  icon: string | null;
}

export interface MovieCard {
  tmdb_id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  genres: string[];
  vote_average: number;
}

export interface RecommendationResponse {
  weather: WeatherInfo;
  mapped_genres: string[];
  movies: MovieCard[];
}

export type WatchlistStatus = 'quero_assistir' | 'assistido';

export interface WatchlistItem {
  id: number;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  genre: string | null;
  status: WatchlistStatus | string;
  rating: number | null;
  weather_label: string | null;
  city: string | null;
  created_at: string;
}

export interface WatchlistPage {
  items: WatchlistItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface WatchlistCreate {
  tmdb_id: number;
  title: string;
  poster_url?: string | null;
  genre?: string | null;
  weather_label?: string | null;
  city?: string | null;
  status?: WatchlistStatus;
  rating?: number | null;
}

export interface WatchlistUpdate {
  status?: WatchlistStatus;
  rating?: number | null;
}
