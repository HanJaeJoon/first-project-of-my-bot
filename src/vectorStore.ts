import fs from 'node:fs';
import path from 'node:path';

import { config } from './config.js';
import type {
  ScoredVectorItem,
  VectorItem,
  VectorStoreStats,
} from './types.js';

const DATA_FILE = path.join(config.dataDir, 'vectors.json');

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

class VectorStore {
  private items: VectorItem[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.items = JSON.parse(
          fs.readFileSync(DATA_FILE, 'utf-8'),
        ) as VectorItem[];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('vectorStore load error:', message);
      this.items = [];
    }
  }

  private save(): void {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.items));
  }

  replace(items: VectorItem[]): void {
    this.items = items;
    this.save();
  }

  clear(): void {
    this.replace([]);
  }

  search(queryEmbedding: number[], topK = 4): ScoredVectorItem[] {
    if (this.items.length === 0) return [];
    const scored: ScoredVectorItem[] = this.items.map((it) => ({
      ...it,
      score: cosine(queryEmbedding, it.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  stats(): VectorStoreStats {
    const sources = [...new Set(this.items.map((v) => v.source))];
    return {
      totalChunks: this.items.length,
      sources,
      sourceCount: sources.length,
    };
  }
}

export const vectorStore = new VectorStore();
