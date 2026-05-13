import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatComplete } from '@shared/api/openai';
import { searchNearbyPlaces } from '@features/google-ai/api/search-nearby-places';
import type { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { parseGPTResponse, preparePlacesForGPT } from '../utils/search';
import { DEFAULT_PLACES_TYPES } from '../utils/constants';
import { generateGPTUserPromptWhatsIsHere, GPT_SYSTEM_PROMPT_WHAT_IS_HERE } from '../utils/prompts';

interface IWhatIsHereState {
  isLoading: boolean;
  error: { title: string; message: string; status: number } | null;
  lastRequestTime: Date | null;
  whatIsHerePlaces: INearbyPlace[];
  selectedWhatIsHerePlaces: INearbyPlace | null;
  requestCount: number;
}

interface IWhatIsHereRequestParams {
  location: { lat: number; lng: number };
  radius?: number;
  includedTypes?: string[];
  maxResultCount?: number;
  city?: string;
}

interface IWhatIsHereActions {
  searchWhatIsHerePlaces: (params: IWhatIsHereRequestParams) => Promise<INearbyPlace[] | null>;
  clearWhatIsHerePlacesResults: () => void;
  clearError: () => void;
  incrementRequestCount: () => void;
  reset: () => void;
  setSelectedWhatIsHerePlaces: (place: INearbyPlace | null) => void;
}

const initialState: IWhatIsHereState = {
  isLoading: false,
  error: null,
  lastRequestTime: null,
  whatIsHerePlaces: [],
  selectedWhatIsHerePlaces: null,
  requestCount: 0
};

export const useWhatIsHereStore = create<IWhatIsHereState & IWhatIsHereActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      searchWhatIsHerePlaces: async (params: IWhatIsHereRequestParams): Promise<INearbyPlace[] | null> => {
        const { location, radius, includedTypes, maxResultCount, city } = params;

        set({ isLoading: true, error: null });

        try {
          // 1. Fetch nearby places from Google.
          const googlePlaces = await searchNearbyPlaces({
            location: { lat: location.lat, lng: location.lng },
            radius: radius ?? 300,
            includedTypes: includedTypes ?? DEFAULT_PLACES_TYPES,
            maxResultCount: Math.min(maxResultCount ?? 20, 20)
          });


          if (!googlePlaces?.length) {
            set({ isLoading: false, whatIsHerePlaces: [] });
            return null;
          }

          // 2. Prepare the places for GPT (attach syntheticId, flatten displayName, etc.).
          const wantedTypes = new Set<string>(includedTypes ?? DEFAULT_PLACES_TYPES);
          const modifiedGooglePlaces = googlePlaces.map((p) => ({
            ...p,
            placeId: p.id,
            displayName: p.displayName.text
          }));
          const aiPlaces = preparePlacesForGPT(modifiedGooglePlaces, wantedTypes);

          if (aiPlaces.length <= 5) {
            // With 5 or fewer places we skip ranking and just ask GPT for descriptions.
            let describedPlaces = aiPlaces;

            try {
              const response = await chatComplete({
                prompt: generateGPTUserPromptWhatsIsHere(aiPlaces, city),
                systemPrompt: GPT_SYSTEM_PROMPT_WHAT_IS_HERE
              });

              if (response) {
                const parsed = parseGPTResponse(response, aiPlaces);
                if (parsed.length) {
                  const descriptionById = new Map(parsed.map((p) => [p.syntheticId, p.description ?? '']));
                  describedPlaces = aiPlaces.map((p) => ({
                    ...p,
                    description: descriptionById.get(p.syntheticId) ?? p.description
                  }));
                }
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              set({ error: { title: 'GPT describe (<=5) failed', message: errorMessage, status: 500 } });
              // GPT failed — fall back to raw googlePlaces without descriptions.
              const fallback = aiPlaces.map((p) => {
                const { syntheticId, ...rest } = p;
                return rest;
              });
              set({
                isLoading: false,
                whatIsHerePlaces: fallback as INearbyPlace[],
                lastRequestTime: new Date()
                // error: 'GPT describe (<=5) failed'
              });
              return fallback as INearbyPlace[];
            }

            const result = describedPlaces.map((p) => {
              const { syntheticId, ...rest } = p;
              return rest;
            });

            set({
              isLoading: false,
              whatIsHerePlaces: result as INearbyPlace[],
              lastRequestTime: new Date()
            });

            return result as INearbyPlace[];
          }

          // 3. Ask GPT to rank the candidates.
          const response = await chatComplete({
            prompt: generateGPTUserPromptWhatsIsHere(aiPlaces, city),
            systemPrompt: GPT_SYSTEM_PROMPT_WHAT_IS_HERE
          });

          let result: INearbyPlace[];

          if (!response) {
            // Fallback: first 5 places
            result = aiPlaces.slice(0, 5).map((p) => {
              const { syntheticId, ...rest } = p;
              return rest;
            });

            set({
              isLoading: false,
              whatIsHerePlaces: result,
              lastRequestTime: new Date(),
              error: null
            });

            return result;
          }

          // 4. Parse the GPT response.
          const parsed = parseGPTResponse(response, aiPlaces);
          const foundIds = parsed.map((p) => p.syntheticId);
          const descMap = parsed.reduce<Record<string, string>>((acc, item) => {
            if (item.description) acc[item.syntheticId] = item.description;
            return acc;
          }, {});

          if (foundIds.length > 0) {
            // Use the picks returned by GPT.
            result = foundIds.slice(0, 5).reduce<INearbyPlace[]>((acc, id) => {
              const src = aiPlaces.find((p) => p.syntheticId === id);
              if (!src) return acc;
              const { syntheticId, ...rest } = src;
              acc.push({ ...rest, description: descMap[id] ?? rest.description });
              return acc;
            }, []);
          } else {
            // Fallback: first 5 places
            result = aiPlaces.slice(0, 5).map((p) => {
              const { syntheticId, ...rest } = p;
              return rest;
            });

            set({
              error: {
                title: 'No valid IDs parsed from GPT response',
                message: 'No valid IDs parsed from GPT response',
                status: 500
              }
            });
          }

          // 5. Commit the new state.
          set({
            isLoading: false,
            whatIsHerePlaces: result,
            lastRequestTime: new Date(),
            requestCount: get().requestCount + 1
          });

          return result;
        } catch (error) {
          const cause = error instanceof Error ? (error.cause as { message?: string; status?: number } | undefined) : undefined;
          const message = cause?.message ?? (error instanceof Error ? error.message : 'Unknown error');
          const status = cause?.status ?? 500;
          set({
            isLoading: false,
            error: { title: 'Fetch nearby places failed', message, status },
            lastRequestTime: new Date()
          });

          return null;
        }
      },

      setSelectedWhatIsHerePlaces: (place: INearbyPlace | null) => {
        set({ selectedWhatIsHerePlaces: place });
      },

      clearWhatIsHerePlacesResults: () => {
        set({
          whatIsHerePlaces: [],
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      },

      incrementRequestCount: () => {
        set((state) => ({ requestCount: state.requestCount + 1 }));
      },

      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'nearby-places-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        }
      },
      // Persist only the fields we actually need across launches.
      partialize: (state: IWhatIsHereState & IWhatIsHereActions) => ({
        requestCount: state.requestCount,
        lastRequestTime: state.lastRequestTime,
        whatIsHerePlaces: state.whatIsHerePlaces
      })
    }
  )
);

export const useRequestStats = () =>
  useWhatIsHereStore((state) => ({
    requestCount: state.requestCount,
    lastRequestTime: state.lastRequestTime
  }));
