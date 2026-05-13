import { create } from 'zustand';
import { fetchPhotonReversePlace } from '../api/geocode-photon-place';
import { IStreetPlace } from '../types/street-place';
import { TMode } from '../types/map';

interface IStreetPlaceStoreState {
  streetPlace: IStreetPlace | null;
  isLoading: boolean;
  error: { title: string; status: number | string; message: string } | null;
  lastRequestTime: Date | null;
  requestCount: number;
  fetchStreetPlace: (
    { latitude, longitude }: { latitude: number; longitude: number },
    mode: TMode
  ) => Promise<string | undefined>;
  clear: () => void;
}
export const useStreetPlaceStore = create<IStreetPlaceStoreState>((set, get) => ({
  streetPlace: null,
  isLoading: false,
  error: null,
  lastRequestTime: null,
  requestCount: 0,
  fetchStreetPlace: async ({ latitude, longitude }, mode: TMode) => {
    const rid = Date.now();
    set({
      isLoading: true,
      error: null,
      _rid: rid,
      lastRequestTime: new Date(),
      requestCount: get().requestCount + 1,
      streetPlace: {
        // id: 'street-id',
        displayName: 'Loading…',
        location: { latitude, longitude }
      }
    } as any);

    try {
      // Temporarily disabled: Google reverse geocode
      // if (mode === 'google') {
      //   const data = await reverseGeocode({ latitude, longitude, apiKey: env.googleMapsApiKey });
      //   const displayName = data ?? 'Unknown place';
      //
      //   set((s) => ({
      //     ...s,
      //     isLoading: false,
      //     lastRequestTime: new Date(),
      //     requestCount: get().requestCount + 1,
      //     streetPlace: {
      //       ...s.streetPlace,
      //       id: 'street-id',
      //       displayName,
      //       location: { latitude, longitude }
      //     }
      //   }));
      //   return displayName;
      // }
      throw new Error('skip-google');
    } catch (e: any) {
      try {
        const photon = await fetchPhotonReversePlace(latitude, longitude, 1);
        const feature = photon?.features?.[0];
        const id = feature?.properties?.osm_id;
        const props: any = feature?.properties ?? {};
        const name = typeof props.name === 'string' ? props.name : '';
        const street = typeof props.street === 'string' ? props.street : '';
        const city = typeof props.city === 'string' ? props.city : '';
        const country = typeof props.country === 'string' ? props.country : '';
        const housenumber = typeof props.housenumber === 'string' ? props.housenumber : '';
        const district = typeof props.district === 'string' ? props.district : '';

        let streetDisplayName = '';
        if (street) {
          streetDisplayName = housenumber ? `${street}, ${housenumber}` : street;
        }
        const displayName = streetDisplayName || name || 'Unknown place';

        const mappedStreetPlace: IStreetPlace = {
          id: id ? String(id) : 'street-id',
          name: name || undefined,
          displayName,
          street: street || undefined,
          district: district || undefined,
          city: city || undefined,
          country: country || undefined,
          location: { latitude, longitude },
          type: 'photon'
        };

        set((s) => ({
          ...s,
          isLoading: false,
          lastRequestTime: new Date(),
          requestCount: get().requestCount + 1,
          streetPlace: mappedStreetPlace
        }));
        return displayName;
      } catch (err: any) {
        const status = err?.status ?? e?.status ?? err?.cause?.status ?? 'unknown';
        const message = err?.cause?.body?.title;

        set({
          isLoading: false,
          error: {
            title: 'Failed to fetch street place',
            status,
            message: message ?? 'unknown'
          },
          streetPlace: { id: 'street-id', displayName: 'Not found', location: { latitude, longitude } }
        });
        return null;
      }
    }
  },
  clear: () => set({ streetPlace: null, error: null, lastRequestTime: null })
}));
