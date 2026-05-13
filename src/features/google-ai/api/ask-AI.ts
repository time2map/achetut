import { chatComplete, chatCompleteWebSearch } from '@shared/api/openai';

export type AskAIParams = {
  prompt: string;
  systemPrompt: string;
  model?: string;
};

/**
 * Helper to query the OpenAI chat API and immediately parse JSON response.
 * Returns parsed value or null on error/empty response.
 */
export async function askAI<T = unknown>({ prompt, systemPrompt, model }: AskAIParams): Promise<T | null> {
  try {
    const response = await chatComplete({ prompt, systemPrompt, model });
    const trimmed = response?.trim();
    if (!trimmed) return null;

    const stripCodeFence = (payload: string) => {
      let text = payload.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json/i, '').replace(/^```/, '');
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      return text.trim();
    };

    const candidates = [trimmed, stripCodeFence(trimmed)];

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        continue;
      }
    }

    // If parsing failed, return raw trimmed text instead of null.
    return trimmed as unknown as T;
  } catch (error: any) {
    // console.error('askAI failed:', error?.message || error);
    return null;
  }
}

export type AskAIParamsWebSearch = {
  prompt: string;
  systemPrompt: string;
  model?: string;
};

export async function askAIWebSearch<T = unknown>({ prompt, systemPrompt, model }: AskAIParamsWebSearch): Promise<T | null> {
  try {
    const response = await chatCompleteWebSearch({ prompt, systemPrompt, model });
    const trimmed = response?.text?.trim();
    if (!trimmed) return null;

    const stripCodeFence = (payload: string) => {
      let text = payload.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json/i, '').replace(/^```/, '');
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      return text.trim();
    };

    const candidates = [trimmed, stripCodeFence(trimmed)];

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        continue;
      }
    }
    return trimmed as unknown as T;
  } catch (error: any) {
    console.error('askAIWebSearch failed:', error?.message || error);
    return null;
  }
}