import { create } from 'zustand';
import { dedupeByPlaceId, geocodePoiList } from '@features/google-ai/api/geocode-ai-places';
import { IGooglePlace } from '../types/google-place';
import { askAI } from '../api/ask-AI';
import { buildGPTPromptTopPlaces } from '../utils/prompts';
import { TCitySuggestion } from './autocomplete';
import { IAIPlace } from '../types/ai-place';
import { TMode } from '../types/map';
import { radiusFromBox } from '../utils/radius-from-bbox';
import { useAiSettingsStore } from './ai-settings';

type TopState = {
  topPlacesGoogle: IGooglePlace[];
  topPlacesAI: IAIPlace[];
  selectedTopPlace: IAIPlace | IGooglePlace | null;
  isLoading: boolean;
  error: { title: string; message?: string; status?: number } | null;
  lastRequestTime: Date | null;
  requestCount: number;
  fetchTopPlaces: (place: TCitySuggestion, mode: TMode) => Promise<IGooglePlace[] | IAIPlace[] | null>;
  clearPlaces: () => void;
  setPlaces: (topPlacesGoogle: IGooglePlace[], topPlacesAI: IAIPlace[]) => void;
  clearSelectedPlace: () => void;
  selectTopPlace: (place: IAIPlace | IGooglePlace | null) => void;
};

export const useTopsStore = create<TopState>((set, get) => ({
  topPlacesGoogle: [],
  topPlacesAI: [],
  selectedTopPlace: null,
  isLoading: false,
  error: null,
  lastRequestTime: null,
  requestCount: 0,

  clearPlaces: () => set({ topPlacesGoogle: [], topPlacesAI: [], error: null, lastRequestTime: null }),
  setPlaces: (topPlacesGoogle: IGooglePlace[], topPlacesAI: IAIPlace[]) =>
    set({ topPlacesGoogle, topPlacesAI, error: null }),
  clearSelectedPlace: () => set({ selectedTopPlace: null }),
  selectTopPlace: (place: IAIPlace | IGooglePlace | null) => set({ selectedTopPlace: place }),

  fetchTopPlaces: async (place: TCitySuggestion, mode: TMode) => {
    if (!place) return null;
    set({ isLoading: true, error: null });
    try {
      const { system, user } = buildGPTPromptTopPlaces(place.name, place.state, place.country);
      const { openAiModel } = useAiSettingsStore.getState();

      const normalizeErrorMessage = (raw: unknown) => {
        if (typeof raw !== 'string') return undefined;
        try {
          const parsed = JSON.parse(raw);
          return parsed?.error ?? parsed?.message ?? raw;
        } catch {
          return raw;
        }
      };

      const aiPlacesRaw = await askAI<Array<{ name?: string; description?: string }>>({
        prompt: user,
        systemPrompt: system,
        model: openAiModel
      });

      // const aiPlacesRaw = await askAIWebSearch<Array<{ name?: string; description?: string }>>({
      //   prompt: user,
      //   systemPrompt: system,
      //   // model: 'gpt-4o-mini'
      //   model: 'gpt-4o'
      // });
      const aiPlaces = Array.isArray(aiPlacesRaw) ? aiPlacesRaw : [];

      // let places: IGooglePlace[] = [];
      let places: any[] = [];
      let fallbackAI: IAIPlace[] = [];

      try {
        if (mode === 'google') {
          const bboxArray = Array.isArray(place.bbox) ? place.bbox : [];
          let radiusMeters = 10000;

          if (bboxArray.length === 4) {
            const [minLng, maxLat, maxLng, minLat] = bboxArray;
            const box = {
              northeast: { lat: maxLat, lng: maxLng },
              southwest: { lat: minLat, lng: minLng }
            };
            const computed = radiusFromBox({ lat: place.coords.latitude, lng: place.coords.longitude }, box);
            if (computed) {
              // clamp to sensible bounds: 1km..50km
              radiusMeters = Math.max(1000, Math.min(50000, Math.round(computed)));
            }
          }

          const { results: geocoded, errors } = await geocodePoiList({
            items: aiPlaces as { name: string; description: string }[],
            city: place.name,
            countryName: place.country,
            center: place.coords,
            radiusMeters: radiusMeters
          });

          const uniqueGeocoded = dedupeByPlaceId(geocoded);

          if (geocoded.length > 0) {
            places = uniqueGeocoded.map((g) => ({
              placeId: g.placeId,
              id: g.placeId,
              displayName: g.displayName,
              primaryType: (g as any).primaryType ?? '',
              types: Array.isArray((g as any).types) ? (g as any).types : [],
              location: g.location ?? { latitude: 0, longitude: 0 },
              photos: Array.isArray(g.photos)
                ? g.photos
                    .map((p: any) => p?.name ?? p?.url ?? '')
                    .filter((s: string) => typeof s === 'string' && s.length > 0)
                    .map((name: string) => ({ name }))
                : [],
              description: g.description ?? ''
            }));
          } else {
            throw new Error('No geocoded results');
          }

          if (errors.length > 0) {
            const first = errors[0];
            const message = normalizeErrorMessage(first.message) ?? first.message;
            set({
              error: { title: 'Fetch top places failed', message, status: first.status }
            });
          }
        } else {
          throw new Error('skip-google');
        }
      } catch (err) {
        const fallbackValid = aiPlaces.filter((p) => typeof p?.name === 'string' && p.name.trim().length > 0);
        fallbackAI = fallbackValid.map((p, idx) => ({
          id: `${p.name}-${idx}`,
          displayName: p.name ?? '',
          location: place.coords,
          description: p.description ?? '',
          bbox: place.bbox,
          type: 'ai',
          city: place.name ?? ''
        }));
      }

      set({
        topPlacesGoogle: places,
        topPlacesAI: fallbackAI,
        lastRequestTime: new Date(),
        requestCount: get().requestCount + 1,
        isLoading: false
      });
      return places.length ? places : fallbackAI;
    } catch (error: any) {
      const status = error?.cause?.status ?? 500;
      const rawMessage = error?.cause?.message ?? error?.message ?? 'Failed to load top places';
      const message = normalizeErrorMessage(rawMessage) ?? rawMessage;
      set({
        isLoading: false,
        error: { title: 'Fetch top places failed', message, status },
        topPlacesGoogle: [],
        topPlacesAI: []
      });
      return null;
    }
  }
}));
