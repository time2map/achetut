type ReverseGeocodeParams = {
  latitude: number;
  longitude: number;
  apiKey?: string | null;
  language?: string;
  mode?: "full" | "city";
};

export async function reverseGeocode({
  latitude,
  longitude,
  apiKey,
  language = "ru",
  mode = "full",
}: ReverseGeocodeParams): Promise<string | undefined> {
  if (!apiKey) return undefined;

  const query = [
    ["latlng", `${latitude},${longitude}`],
    ["key", apiKey],
    ["language", language],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${query}`
  );

  if (!response.ok) {
    throw new Error("geocode_failed");
  }

  const data = await response.json();

  if (
    data.status === "OK" &&
    Array.isArray(data.results) &&
    data.results.length
  ) {
    const first = data.results[0];

    if (mode === "city") {
      const components = first.address_components as
        | { long_name: string; short_name: string; types: string[] }[]
        | undefined;

      if (Array.isArray(components)) {
        const cityComponent =
          components.find((c) => c.types.includes("locality")) ||
          components.find((c) => c.types.includes("postal_town")) ||
          components.find((c) =>
            c.types.includes("administrative_area_level_2")
          ) ||
          components.find((c) =>
            c.types.includes("administrative_area_level_1")
          );

        if (cityComponent?.long_name) {
          return cityComponent.long_name;
        }
      }
    }

    return first.formatted_address as string;
  }

  if (data.status === "ZERO_RESULTS") {
    return undefined;
  }

  throw new Error("geocode_failed");
}
