import { AI_COMPLETION_URL } from '@features/google-ai/utils/constants';
import { DEFAULT_OPENAI_MODEL, useAiSettingsStore } from '@features/google-ai/store/ai-settings';
import type { ChatMessage } from '../types/chat';
import { env } from '@shared/config/env';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';

type ChatParams = {
  prompt: string;
  systemPrompt: string;
  model?: string;
};

export async function chatComplete({ prompt, systemPrompt, model }: ChatParams): Promise<string> {
  const { openAiModel } = useAiSettingsStore.getState();
  const xUserIdHeader = env.xUserId ?? (await getOrCreateInstallationId());
  const resolvedModel = model ?? openAiModel ?? DEFAULT_OPENAI_MODEL;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  // const res = await fetch("https://api.openai.com/v1/chat/completions", {
  const res = await fetch(`${AI_COMPLETION_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': xUserIdHeader
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages
    })
  });

  const data = await res.json();
  
  if (!res.ok) {
    // const message = data?.error?.message || "Request failed";
    throw new Error('Request failed', { cause: data });
  }
  return data?.choices?.[0]?.message?.content ?? '';
}

type ChatParamsWebSearch = {
  model?: string; // например "gpt-4o-mini" или "gpt-5-mini"
  prompt: string;
  systemPrompt?: string;
  // опционально: ограничить домены (например, только карты/вики)
  allowedDomains?: string[];
  // опционально: вернуть список источников
  includeSources?: boolean;
};

function extractOutputText(resp: any): string {
  // Responses API возвращает массив output items; в тексте item.type="message"
  const out = resp?.output;
  if (!Array.isArray(out)) return '';

  let text = '';
  for (const item of out) {
    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === 'output_text' && typeof part.text === 'string') {
          text += part.text;
        }
      }
    }
  }
  return text;
}

export async function chatCompleteWebSearch({
  prompt,
  systemPrompt = '',
  allowedDomains,
  includeSources = false,
  model
}: ChatParamsWebSearch): Promise<{ text: string; sources?: any[] }> {
  const { openAiModel } = useAiSettingsStore.getState();
  const resolvedModel = model ?? openAiModel ?? DEFAULT_OPENAI_MODEL;
  const xUserIdHeader = env.xUserId ?? (await getOrCreateInstallationId());

  const tools: any[] = [
    allowedDomains?.length
      ? {
          type: 'web_search',
          filters: { allowed_domains: allowedDomains }
        }
      : { type: 'web_search' }
  ];

  const body: any = {
    model: resolvedModel,
    tools,
    tool_choice: 'auto',
    // можно либо через instructions, либо через input array
    // instructions — удобнее для “systemPrompt”
    instructions: systemPrompt || undefined,
    input: prompt,
    // чтобы получить полный список источников, как в доке:
    // include: ["web_search_call.action.sources"]
    include: includeSources ? ['web_search_call.action.sources'] : undefined
  };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': xUserIdHeader
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');

  const text = extractOutputText(data);

  // Источники могут быть в data.output (web_search_call.action.sources), если includeSources=true
  // либо в data.sources (зависит от настроек/версии), но самый стабильный путь — include.
  let sources: any[] | undefined;
  if (includeSources && Array.isArray(data?.output)) {
    const ws = data.output.find((x: any) => x?.type === 'web_search_call');
    sources = ws?.action?.sources;
  }

  return { text, sources };
}
