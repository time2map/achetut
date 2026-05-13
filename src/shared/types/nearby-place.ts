export interface INearbyPlace {
  id: string;
  name?: string;
  primaryType?: string;
  types?: string[];
  location: { latitude: number; longitude: number };
  photo?: { url: string; source?: string } | null;
  photos?: Array<{ url: string; source?: string }>;
  description?: string;
};
