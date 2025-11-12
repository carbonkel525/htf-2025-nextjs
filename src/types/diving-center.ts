export interface DivingCenter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm?: number; // Optional radius in kilometers, defaults to 2.8km if not provided
}
