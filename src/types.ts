/**
 * Shared type definitions for the Korean RAG chatbot.
 */

export interface AppConfig {
  ollamaBaseUrl: string;
  embeddingModel: string;
  chatModel: string;

  chunkSize: number;
  chunkOverlap: number;
  topK: number;

  chatTemperature: number;
  chatMaxTokens: number;
  chatStream: boolean;

  embedConcurrency: number;

  knowledgeDir: string;
  dataDir: string;
}

export interface LoadedDocument {
  filename: string;
  path: string;
  content: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  source: string;
  chunkIndex: number;
}

export interface VectorItem extends DocumentChunk {
  embedding: number[];
}

export interface ScoredVectorItem extends VectorItem {
  score: number;
}

export interface VectorStoreStats {
  totalChunks: number;
  sources: string[];
  sourceCount: number;
}

export interface OllamaStatus {
  ok: boolean;
  error?: string;
  models?: string[];
  hasEmbedding?: boolean;
  hasChat?: boolean;
  embeddingModel?: string;
  chatModel?: string;
}

export interface QuerySource {
  source: string;
  score: string;
  preview: string;
}

export interface QueryResult {
  answer: string;
  sources: QuerySource[];
}

export interface ChatOptions {
  system: string;
  user: string;
  stream?: boolean;
  onToken?: (token: string) => void;
}

export interface EmbedManyOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

export interface QueryOptions {
  stream?: boolean;
  onToken?: (token: string) => void;
}

// --- Ollama wire types ---

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatResponse {
  message?: OllamaChatMessage;
}

export interface OllamaChatStreamChunk {
  message?: { content?: string };
  done?: boolean;
}

export interface OllamaTagsModel {
  name: string;
}

export interface OllamaTagsResponse {
  models?: OllamaTagsModel[];
}
