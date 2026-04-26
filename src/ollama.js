import { config } from './config.js';

const baseUrl = () => config.ollamaBaseUrl.replace(/\/$/, '');

async function postJson(path, body) {
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

export async function embed(text) {
  const res = await postJson('/api/embeddings', {
    model: config.embeddingModel,
    prompt: text,
  });
  const data = await res.json();
  return data.embedding;
}

export async function embedMany(texts, { concurrency = config.embedConcurrency, onProgress } = {}) {
  const results = new Array(texts.length);
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= texts.length) return;
      results[i] = await embed(texts[i]);
      done += 1;
      onProgress?.(done, texts.length);
    }
  };

  const n = Math.max(1, Math.min(concurrency, texts.length));
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

export async function chat({ system, user, stream = config.chatStream, onToken } = {}) {
  const body = {
    model: config.chatModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    stream,
    options: {
      temperature: config.chatTemperature,
      num_predict: config.chatMaxTokens,
    },
  };

  const res = await postJson('/api/chat', body);

  if (!stream) {
    const data = await res.json();
    return data.message?.content ?? '';
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const part = JSON.parse(line);
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

export async function status() {
  try {
    const res = await fetch(`${baseUrl()}/api/tags`);
    if (!res.ok) return { ok: false, error: `Ollama ${res.status}` };
    const data = await res.json();
    const models = data.models?.map((m) => m.name) || [];
    const has = (target) => {
      const base = target.split(':')[0];
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
    return { ok: false, error: err.message };
  }
}
