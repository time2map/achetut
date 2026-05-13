import { INearbyPlace } from './nearby-place';
import { IStreetPlace } from './street-place';
import { IAIPlace } from './ai-place';
import { IGooglePlace } from './google-place';

export type TCurrentPlace =
  | ((INearbyPlace | IStreetPlace | IAIPlace | IGooglePlace) & { selectedPhotoUrl?: string })
  | null;

export type TMode = 'ai' | 'google';
