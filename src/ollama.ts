import { config } from './config.js';
import type {
  ChatOptions,
  EmbedManyOptions,
  OllamaChatResponse,
  OllamaChatStreamChunk,
  OllamaEmbeddingResponse,
  OllamaStatus,
  OllamaTagsResponse,
} from './types.js';

const baseUrl = (): string => config.ollamaBaseUrl.replace(/\/$/, '');

async function postJson(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Ollama ${path} ${res.status}: ${detail || res.statusText}`);
  }
  return res;
}

export async function embed(text: string): Promise<number[]> {
  const res = await postJson('/api/embeddings', {
    model: config.embeddingModel,
    prompt: text,
  });
  const data = (await res.json()) as OllamaEmbeddingResponse;
  return data.embedding;
}

export async function embedMany(
  texts: string[],
  { concurrency = config.embedConcurrency, onProgress }: EmbedManyOptions = {},
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);
  let cursor = 0;
  let done = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = cursor++;
      if (i >= texts.length) return;
      const text = texts[i];
      if (text === undefined) continue;
      results[i] = await embed(text);
      done += 1;
      onProgress?.(done, texts.length);
    }
  };

  const n = Math.max(1, Math.min(concurrency, texts.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export async function chat({
  system,
  user,
  stream = config.chatStream,
  onToken,
}: ChatOptions): Promise<string> {
  const body = {
    model: config.chatModel,
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    stream,
    options: {
      temperature: config.chatTemperature,
      num_predict: config.chatMaxTokens,
    },
  };

  const res = await postJson('/api/chat', body);

  if (!stream) {
    const data = (await res.json()) as OllamaChatResponse;
    return data.message?.content ?? '';
  }

  if (!res.body) {
    throw new Error('Ollama chat: missing response body for stream');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const part = JSON.parse(line) as OllamaChatStreamChunk;
        const piece = part.message?.content ?? '';
        if (piece) {
          full += piece;
          onToken?.(piece);
        }
      } catch {
        // ignore malformed line
      }
    }
  }
  return full;
}

export async function status(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${baseUrl()}/api/tags`);
    if (!res.ok) return { ok: false, error: `Ollama ${res.status}` };
    const data = (await res.json()) as OllamaTagsResponse;
    const models = data.models?.map((m) => m.name) ?? [];
    const has = (target: string): boolean => {
      const base = target.split(':')[0] ?? target;
      return models.some((m) => m === target || m.startsWith(`${base}:`));
    };
    return {
      ok: true,
      models,
      hasEmbedding: has(config.embeddingModel),
      hasChat: has(config.chatModel),
      embeddingModel: config.embeddingModel,
      chatModel: config.chatModel,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
