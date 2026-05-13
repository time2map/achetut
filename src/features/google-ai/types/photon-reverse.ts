export interface IPhotonReverse {
  type: string;
  features: Partial<IPhotonReverseFeature>[];
}

export interface IPhotonReverseFeature {
  type: string;
  properties: {
    osm_type: string;
    osm_id: number;
    osm_key: string;
    osm_value: string;
    type: string;
    postcode: string;
    housenumber: string;
    countrycode: string;
    country: string;
    city: string;
    district: string;
    name: string;
    street: string;
    state: string;
    extent: number[];
    geometry: {
      type: string;
      coordinates: number[];
    };
  };
}