import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const DATA_FILE = path.join(config.dataDir, 'vectors.json');

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

class VectorStore {
  constructor() {
    this.items = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('vectorStore load error:', err.message);
      this.items = [];
    }
  }

  save() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.items));
  }

  replace(items) {
    this.items = items;
    this.save();
  }

  clear() {
    this.replace([]);
  }

  search(queryEmbedding, topK = 4) {
    if (this.items.length === 0) return [];
    const scored = this.items.map((it) => ({
      ...it,
      score: cosine(queryEmbedding, it.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  stats() {
    const sources = [...new Set(this.items.map((v) => v.source))];
    return {
      totalChunks: this.items.length,
      sources,
      sourceCount: sources.length,
    };
  }
}

export const vectorStore = new VectorStore();
