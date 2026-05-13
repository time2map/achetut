import { AIPlace } from './search';

export const PROMPT_TOP_PLACES = {
  system:
    `You are a ranking assistant. From up to 20 Google Places items, choose the 5 best to visit. ` +
    `Prioritize higher rating, more user ratings, and overall appeal. ` +
    `Respond ONLY in JSON as an array. Each item must be an object with field "syntheticId" and "description". ` +
    `Do not invent syntheticId or names. No extra text.`,
  user:
    `Here is a list of places from Google Places API (at most 20).` +
    `Select the 5 best and return their ids and names.` +
    `Respond with JSON array of objects: [{ "syntheticId": "id-0", "description": "description" }, ...].` +
    `Input JSON:`
};

export const buildGPTPromptTopPlaces = (
  city: string,
  state: string,
  country: string
): { system: string; user: string } => {
  const system = [
    'You are a local travel expert.',
    'Suggest up to 15 real, well-known places that can be geocoded on Google Maps.',
    'Prefer historical landmarks, museums, monuments, theaters, film-related spots, viewpoints, iconic architecture, cultural venues, parks, and unique experiences.',
    'Exclude food and drink venues (no restaurants, cafes, bars, food markets) and generic shopping malls.',
    'Use concise English names exactly as they appear on maps; avoid invented or generic names.',
    'Look for places in a specific city',
    'Return ONLY a JSON array of objects with fields: { "name": string, "description": string }.'
  ].join(' ');

  const user = [
    `Act as a local tour guide for the city: ${city}, ${state}, ${country}.`,
    'The value above is the city name only. Recommend up to 15 must-visit places located in this city.',
    'Focus on memorable places tied to history, movies, culture, art, architecture, nature, or unique experiences.',
    'Exclude any food/drink places and generic malls;',
    'Respond only with a JSON array without surrounding text.',
    "Each item must include a 'name' field and may optionally include a very short 'description' (one or two sentences)."
  ].join(' ');

  return { system, user };
};

type BuildAboutPlaceParams = {
  name: string;
  coords?: { latitude: number; longitude: number }; // e.g. "Paris, France" or "59.93, 30.33"
  description?: string; // short context we already know
  city?: string;
  country?: string;
};

// Prompt that asks GPT for a detailed, factual description of a place plus a couple of facts.
export const buildGPTPromptAboutPlaces = ({
  name,
  coords,
  city,
  country
}: BuildAboutPlaceParams): { system: string; user: string } => {
  const system = [
    'You are a precise local travel expert.',
    'Never invent facts, dates, awards, or nearby places.',
    'If unsure, write "Unknown".',
    'Output ONLY a single valid JSON object matching: {"description": string}.',
    'English only. 80–120 words.',
    'No markdown, no emojis, no line breaks.',
    'do not return the coordinates or the address of the location in the response.'
  ].join(' ');

  const user = [
    `Place name: ${name || 'Unknown'}`,
    coords ? `Coordinates: ${coords.latitude},${coords.longitude}` : '',
    city ? `City: ${city}` : '',
    country ? `Country: ${country}` : '',
    '',
    'Write description 80–120 words.',
    'Include 2–4 interesting facts inline (not as a list).',
    'Return JSON only.'
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
};

// Build the GPT prompt for top-places ranking.
export const buildGPTPrompt = (places: AIPlace[]): string => {
  return [
    'Here is a list of places from Google Places API (at most 20).',
    'Select the 5 best and return their ids and names.',
    'Respond with JSON array of objects: [{ "syntheticId": "id-0", "description": "description" }, ...].',
    'Input JSON:',
    JSON.stringify(places, null, 2)
  ].join('\n');
};


export const GPT_SYSTEM_PROMPT_WHAT_IS_HERE =
  'You write concise, factual descriptions for given places. Respond only with JSON array of {syntheticId, description}. No extra text.';

export const generateGPTUserPromptWhatsIsHere = (places: any[], city?: string): string => {
  return [
    'You are a concise local travel guide.',
    city ? `City: ${city}` : null,
    'For each place below, write a short 1–2 sentence description (factual, no markdown).',
    'Return ONLY JSON array: [{ "syntheticId": "id-0", "description": "text" }, ...].',
    'Use only the provided syntheticId values, do not invent new places.',
    'Places JSON:',
    JSON.stringify(
      places.map((p) => ({
        syntheticId: p.syntheticId,
        displayName: p.displayName,
        location: p.location,
        primaryType: p.primaryType
      })),
      null,
      2
    )
  ]
    .filter(Boolean)
    .join('\n');
}