import { create } from 'zustand';
import { AUTOCOMPLETE_URL } from '../utils/constants';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';
import { env } from '@shared/config/env';

export type TCitySuggestion = {
  name: string;
  id: string;
  coords: { latitude: number; longitude: number };
  state: string;
  featureType: string;
  countryCode: string;
  country: string;
  bbox: number[];
  city: string;
};

type PhotonGeometry = {
  type: string;
  coordinates: [number, number];
};

type PhotonProperties = {
  osm_type?: string;
  osm_id?: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  postcode?: string;
  countrycode?: string;
  name?: string;
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  extent?: number[];
};

type PhotonFeature = {
  type: 'Feature';
  properties: PhotonProperties;
  geometry: PhotonGeometry;
  bbox?: number[];
};

type PhotonResponse = {
  type: 'FeatureCollection';
  features: PhotonFeature[];
};

type AutocompleteState = {
  autocomplete: TCitySuggestion[];
  isLoading: boolean;
  error: string | null;
  lastRequestTime: Date | null;
  requestCount: number;
  // fetchAutocomplete: (query: string) => Promise<TCitySuggestion[]>;
  fetchAutocomplete: (query: string) => Promise<TCitySuggestion[]>;
  // fetchAutocompleteMapbox: (query: string) => Promise<Prediction[]>;
  clear: () => void;
};

let currentAbortController: AbortController | null = null;

export const useAutocompleteStore = create<AutocompleteState>((set, get) => ({
  autocomplete: [],
  isLoading: false,
  error: null,
  lastRequestTime: null,
  requestCount: 0,

  // fetchAutocomplete: async (query: string) => {
  //   const trimmed = query.trim();
  //   if (!trimmed) {
  //     set({ autocomplete: [] });
  //     return [];
  //   }

  //   set({ isLoading: true, error: null });
  //   try {
  //     const results = await requestGoogleAutocomplete(trimmed);
  //     const mapped = results.map((result) => ({
  //       ...result,
  //       // coords: result.location,
  //       // formatted: result.description,
  //       name: result.description ?? ''
  //     }));
  //     set({
  //       autocomplete: mapped,
  //       isLoading: false,
  //       lastRequestTime: new Date(),
  //       requestCount: get().requestCount + 1
  //     });
  //     return mapped;
  //   } catch (error: any) {
  //     set({
  //       isLoading: false,
  //       error: error?.message ?? 'Failed to fetch autocomplete',
  //       autocomplete: []
  //     });
  //     return [];
  //   }
  // },

  fetchAutocomplete: async (query: string) => {
    const xUserId = env.xUserId ?? await getOrCreateInstallationId();
    const trimmed = query.trim();
    if (!trimmed) {
      set({ autocomplete: [] });
      return [];
    }

    set({ isLoading: true, error: null });
    try {
      // отменяем предыдущий in-flight запрос
      if (currentAbortController) currentAbortController.abort();
      currentAbortController = new AbortController();

      const params = new URLSearchParams();
      params.set('q', trimmed);
      params.set('limit', '5');
      params.set('lang', 'en');

      params.append('osm_tag', 'place:city');
      params.append('osm_tag', 'place:town');
      params.append('osm_tag', 'place:village');
      const res = await fetch(`${AUTOCOMPLETE_URL}/?${params.toString()}`, {
        signal: currentAbortController.signal,
        headers: {
          'x-user-id': xUserId
        }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Photon failed: ${res.status} ${res.statusText} ${text}`);
      }
      const data: PhotonResponse = await res.json();
      const features: PhotonFeature[] = Array.isArray(data?.features) ? data.features : [];

      const mapped = features.map((f, idx) => {
        const props = f?.properties ?? {};
        const [longitude = 0, latitude = 0] = Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates : [];

        const city = props.city ?? props.town ?? props.village ?? '';
        const country = props.country ?? '';
        const name = props.name ?? city;
        let bbox: number[] = [];
        if (Array.isArray(props.extent)) {
          bbox = props.extent;
        } else if (Array.isArray(f?.bbox)) {
          bbox = f.bbox;
        }
        const state = props.state ?? props.county ?? '';
        const countryCode = props.countrycode ?? '';

        return {
          name,
          id: props.osm_id ? String(props.osm_id) : `osm-${idx}`,
          coords: { latitude, longitude },
          state,
          featureType: props.type ?? props.osm_value ?? '',
          countryCode,
          country,
          bbox,
          city
        } as TCitySuggestion;
      });

      set({
        autocomplete: mapped,
        isLoading: false,
        lastRequestTime: new Date(),
        requestCount: get().requestCount + 1
      });
      return mapped;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.message ?? 'Failed to fetch autocomplete (photon)',
        autocomplete: []
      });
      return [];
    }
  },

  clear: () => set({ autocomplete: [], error: null })
}));
