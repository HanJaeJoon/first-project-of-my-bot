import 'dotenv/config';

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const bool = (v, d) => {
  if (v === undefined) return d;
  return /^(1|true|yes|on)$/i.test(String(v));
};

export const config = Object.freeze({
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embeddingModel: process.env.EMBEDDING_MODEL || 'bge-m3',
  chatModel: process.env.CHAT_MODEL || 'qwen2.5:7b',

  chunkSize: num(process.env.CHUNK_SIZE, 700),
  chunkOverlap: num(process.env.CHUNK_OVERLAP, 100),
  topK: num(process.env.TOP_K, 4),

  chatTemperature: num(process.env.CHAT_TEMPERATURE, 0.3),
  chatMaxTokens: num(process.env.CHAT_MAX_TOKENS, 1024),
  chatStream: bool(process.env.CHAT_STREAM, true),

  embedConcurrency: num(process.env.EMBED_CONCURRENCY, 4),

  knowledgeDir: process.env.KNOWLEDGE_DIR || './knowledge',
  dataDir: process.env.DATA_DIR || './data',
});
