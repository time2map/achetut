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
          // 1. Получаем места от Google
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

          // 2. Подготавливаем места для GPT
          const wantedTypes = new Set<string>(includedTypes ?? DEFAULT_PLACES_TYPES);
          const modifiedGooglePlaces = googlePlaces.map((p) => ({
            ...p,
            placeId: p.id,
            displayName: p.displayName.text
          }));
          const aiPlaces = preparePlacesForGPT(modifiedGooglePlaces, wantedTypes);

          if (aiPlaces.length <= 5) {
            
            // Если мест ≤ 5, просим GPT сгенерировать описания для каждого

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
              // если GPT упал, возвращаем сырые googlePlaces без описаний
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

          // 3. Запрашиваем ранжирование у GPT

          const response = await chatComplete({
            prompt: generateGPTUserPromptWhatsIsHere(aiPlaces, city),
            systemPrompt: GPT_SYSTEM_PROMPT_WHAT_IS_HERE
          });

          let result: INearbyPlace[];

          if (!response) {
            // Fallback: первые 5 мест
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

          // 4. Парсим ответ GPT
          const parsed = parseGPTResponse(response, aiPlaces);
          const foundIds = parsed.map((p) => p.syntheticId);
          const descMap = parsed.reduce<Record<string, string>>((acc, item) => {
            if (item.description) acc[item.syntheticId] = item.description;
            return acc;
          }, {});

          if (foundIds.length > 0) {
            // Используем выбор GPT
            result = foundIds
              .slice(0, 5)
              .map((id) => {
                const src = aiPlaces.find((p) => p.syntheticId === id);
                if (!src) return null;
                const { syntheticId, ...rest } = src;
                return { ...rest, description: descMap[id] ?? rest.description };
              })
              .filter((r): r is INearbyPlace => !!r);
          } else {
            // Fallback: первые 5 мест
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

          // 5. Обновляем состояние
          set({
            isLoading: false,
            whatIsHerePlaces: result,
            lastRequestTime: new Date(),
            requestCount: get().requestCount + 1
          });

          return result;
        } catch (error) {
          set({
            isLoading: false,
            error: { title: 'Fetch nearby places failed', message: error.cause.message, status: error.cause.status },
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
      // Сохраняем только определенные поля
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
