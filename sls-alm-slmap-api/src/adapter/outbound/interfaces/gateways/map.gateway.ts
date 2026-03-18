export interface MapGateway {
  getAllStoreLocationMarker(): Promise<StoreLocation[]>;
}

type longitude = number;
type latitude = number;

export interface StoreLocation {
  id: number;
  position: [longitude, latitude];
  name: string;
  description: string;
}
