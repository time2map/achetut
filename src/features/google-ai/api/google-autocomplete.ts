// Google autocomplete request flow


// type AutocompletePrediction = {
//   description?: string;
//   place_id?: string;
// };

// type AutocompleteResponse = {
//   predictions?: AutocompletePrediction[];
//   status?: string;
// };

// export const requestGoogleAutocomplete = async (
//   query: string,
//   opts?: {
//     country?: string; // 'ru'
//     location?: { lat: number; lng: number };
//     radiusMeters?: number;
//   }
// ): Promise<AutocompletePrediction[]> => {

//   const params = new URLSearchParams({
//     input: query,
//     language: 'en',

//     types: '(cities)',

//     // components: `country:${opts?.country ?? 'ru'}`
//   });

//   if (opts?.location && opts?.radiusMeters) {
//     params.set('location', `${opts.location.lat},${opts.location.lng}`);
//     params.set('radius', String(opts.radiusMeters));
//   }

//   const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

//   const res = await fetch(url);
//   if (!res.ok) return [];

//   const data: AutocompleteResponse = await res.json();
//   return data?.predictions ?? [];
// };