import { INearbyPlace } from '@features/google-ai/types/nearby-place';
export type AIPlace = {
  syntheticId: string;
  description?: string;
};

// GPT response validation
export type ParsedGPTItem = { syntheticId: string; description?: string };

export const parseGPTResponse = (response: string, places: AIPlace[]): ParsedGPTItem[] => {
  try {
    let cleanResponse = response.trim();

    // Strip markdown code fences GPT sometimes wraps the JSON in.
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.substring(7).trim();
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.substring(3).trim();
    }

    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3).trim();
    }

    cleanResponse = cleanResponse.replace(/^\uFEFF/, '');

    const json = JSON.parse(cleanResponse);

    if (!Array.isArray(json)) {
      return [];
    }

    const items = json
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const syntheticId =
          (item as any).syntheticId && typeof (item as any).syntheticId === 'string'
            ? (item as any).syntheticId
            : (item as any).id && typeof (item as any).id === 'string'
            ? (item as any).id
            : null;
        if (!syntheticId) return null;

        if (!places.some((p) => p.syntheticId === syntheticId)) return null;

        const description = typeof (item as any).description === 'string' ? (item as any).description : undefined;

        return { syntheticId, description };
      })
      .filter((it: ParsedGPTItem | null): it is ParsedGPTItem => it !== null);

    return items as ParsedGPTItem[];
  } catch (error) {
    console.error('Failed to parse GPT response:', error);
    return [];
  }
};


// Pick places by id, preserving the order of `ids`.
export const pickPlacesByIds = (ids: string[], places: AIPlace[]): INearbyPlace[] => {
  const result: INearbyPlace[] = [];

  for (const id of ids) {
    const place = places.find((p) => p.syntheticId === id);
    if (place) {
      const { syntheticId, ...rest } = place;
      result.push(rest as INearbyPlace);
    }
  }

  return result;
};

// Filter by wanted types and attach a stable syntheticId for GPT to reference.
export const preparePlacesForGPT = (places: INearbyPlace[], wantedTypes: Set<string>) => {
  const filtered = places.filter(
    (p) => wantedTypes.has(p.primaryType ?? '') || (p.types ?? []).some((t) => wantedTypes.has(t ?? ''))
  );

  return filtered.map((p, index) => ({
    ...p,
    syntheticId: `id-${index}`,
    displayName: p.displayName,
    location: p.location,
    primaryType: p.primaryType,
  }));
};
