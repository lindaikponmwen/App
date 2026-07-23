import {
  OPENROUTER_API_URL,
  OPENROUTER_DEFAULT_API_KEY,
  OPENROUTER_HTTP_REFERER,
  OPENROUTER_APP_TITLE,
  MODELS,
} from './config';

let currentApiKey = OPENROUTER_DEFAULT_API_KEY;
let currentModelId = MODELS[0].id;

export function setApiKey(key: string) {
  currentApiKey = key;
}

export function setModel(modelId: string) {
  currentModelId = modelId;
}

export function getApiKey() {
  return currentApiKey;
}

export function getCurrentModel() {
  return MODELS.find(m => m.id === currentModelId) ?? MODELS[0];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; modelId?: string; signal?: AbortSignal }
): Promise<string> {
  const modelId = opts?.modelId ?? currentModelId;
  const maxTokens = opts?.maxTokens ?? 2048;
  const signal = opts?.signal;

  const makeRequest = async (mid: string): Promise<string> => {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentApiKey.trim()}`,
        'HTTP-Referer': OPENROUTER_HTTP_REFERER,
        'X-Title': OPENROUTER_APP_TITLE,
      },
      body: JSON.stringify({
        model: mid,
        messages,
        max_tokens: maxTokens,
      }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) {
      const detail =
        data?.error?.metadata?.raw ||
        data?.error?.message ||
        `HTTP ${res.status}`;
      throw new Error(detail);
    }
    return (
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.message?.reasoning ||
      '(no response)'
    );
  };

  try {
    return await makeRequest(modelId);
  } catch (firstErr) {
    if (signal?.aborted) throw firstErr;
    const fallbacks = MODELS.filter(m => m.id !== modelId);
    for (const fb of fallbacks) {
      try {
        return await makeRequest(fb.id);
      } catch {
        if (signal?.aborted) throw firstErr;
        continue;
      }
    }
    throw firstErr;
  }
}
