import { create } from 'zustand';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { getPoiDetails } from '../api/get-poi-details';

interface TPlace {
  placeId: string;
  name: string;
  coords: { latitude: number; longitude: number };
}

interface IInfoPlaceState {
  isLoading: boolean;
  error: { title: string; status: number | string; message: string } | null;
  lastRequestTime: Date | null;
  place: INearbyPlace | null;
  requestCount: number;
  fetchPlace: (place: TPlace) => Promise<INearbyPlace | null>;
  clearPlace: () => void;
  setPlace: (place: INearbyPlace | null) => void;
}

export const useInfoPlaceStore = create<IInfoPlaceState>((set, get) => ({
  isLoading: false,
  error: null,
  lastRequestTime: null,
  place: null,
  requestCount: 0,
  clearPlace: () => set({ place: null, error: null }),
  setPlace: (place: INearbyPlace | null) => set({ place: place }),
  fetchPlace: async (place: TPlace) => {
    const { placeId, name, coords } = place;
    if (!placeId) return null;
    set({
      isLoading: true,
      place: { id: 'info-place-id', placeId: placeId, displayName: name, location: coords },
      error: null
    });
    try {
      const data = await getPoiDetails(placeId);

      const mapped: INearbyPlace = {
        id: 'info-place-id',
        placeId: placeId,
        displayName: data?.displayName.text ?? name,
        location: coords,
        photos: data?.photos
      };

      set({
        place: mapped,
        isLoading: false,
        lastRequestTime: new Date(),
        requestCount: get().requestCount + 1
      });
      return mapped;
    } catch (error: unknown) {
      const err = error as {
        status?: number | string;
        message?: string;
        response?: { status?: number | string; statusText?: string; data?: { message?: string } };
      };
      const status = err?.status ?? err?.response?.status;
      const rawMessage = err?.message ?? err?.response?.statusText ?? err?.response?.data?.message ?? 'Unknown error';
      let message = rawMessage;
      if (typeof rawMessage === 'string') {
        try {
          const parsed = JSON.parse(rawMessage);
          message = parsed?.error ?? parsed?.message ?? rawMessage;
        } catch {
          // keep rawMessage
        }
      }
      console.log('error fetchPlace', { status, message });

      set({
        place: { id: `place-${name}`, placeId: placeId, displayName: name, location: coords },
        error: { title: `Failed to fetch place info`, status: status ?? 'unknown', message: message },
        isLoading: false
      });
      return null;
    }
  }
}));
