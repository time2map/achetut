export interface IStreetPlace {
  id: string;
  displayName: string;
  location: { latitude: number; longitude: number };
  name?: string;
  street?: string;
  district?: string;
  city?: string;
  country?: string;
  type?: string;
}