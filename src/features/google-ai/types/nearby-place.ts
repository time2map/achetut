export interface INearbyPlace {
  id: string;
  placeId: string;
  displayName: string;
  primaryType?: string;
  types?: string[];
  location: { latitude: number; longitude: number };
  photos?: Array<{ name: string; }>;
  description?: string;
};
