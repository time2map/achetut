export interface IAIPlace {
  id: string;
  displayName: string;
  description: string;
  location: { latitude: number; longitude: number };
  city: string;
  type: 'ai';
  bbox: number[];
}
