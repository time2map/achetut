export interface IGooglePlace {
  id: string;
  placeId: string;
  displayName: string;
  primaryType: string;
  types: string[];
  location: { latitude: number; longitude: number };
  // photo: { url: string } | null;
  photos?: { name: string }[];
  description: string;
};

export interface IGooglePlaceWithPhotos extends Omit<IGooglePlace, 'photo'>  {
  photos: { name: string }[];
}
