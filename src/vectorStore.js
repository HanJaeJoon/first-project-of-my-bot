import fs from 'fs';

const DATA_FILE = './data/vectors.json';

/**
 * Simple in-memory vector store with file persistence
 */
class VectorStore {
  constructor() {
    this.vectors = [];
    this.load();
  }

  /**
   * Load vectors from file
   */
  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        this.vectors = JSON.parse(data);
        console.log(`Loaded ${this.vectors.length} vectors from store`);
      }
    } catch (error) {
      console.error('Error loading vectors:', error.message);
      this.vectors = [];
    }
  }

  /**
   * Save vectors to file
   */
  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.vectors, null, 2));
      console.log(`Saved ${this.vectors.length} vectors to store`);
    } catch (error) {
      console.error('Error saving vectors:', error.message);
    }
  }

  /**
   * Add vectors with metadata
   */
  add(items) {
    // items: [{ id, text, source, embedding }]
    this.vectors.push(...items);
    this.save();
  }

  /**
   * Clear all vectors
   */
  clear() {
    this.vectors = [];
    this.save();
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find top-k similar vectors
   */
  search(queryEmbedding, topK = 3) {
    if (this.vectors.length === 0) {
      return [];
    }

    const scored = this.vectors.map(item => ({
      ...item,
      score: this.cosineSimilarity(queryEmbedding, item.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, topK);
  }

  /**
   * Get store stats
   */
  stats() {
    const sources = [...new Set(this.vectors.map(v => v.source))];
    return {
      totalChunks: this.vectors.length,
      sources: sources,
      sourceCount: sources.length
    };
  }
}

export const vectorStore = new VectorStore();
