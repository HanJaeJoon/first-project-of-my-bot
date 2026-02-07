import { getEmbedding, getEmbeddings, chatCompletion } from './embeddings.js';
import { vectorStore } from './vectorStore.js';
import { loadDocuments, processDocuments } from './loader.js';

/**
 * Ingest documents into the vector store
 */
export async function ingestDocuments(knowledgeDir, config) {
  const { chunkSize, chunkOverlap, embeddingModel } = config;
  
  console.log('\n📚 Loading documents...');
  const documents = loadDocuments(knowledgeDir);
  
  if (documents.length === 0) {
    console.log('No documents found. Add .txt or .md files to the knowledge/ folder.');
    return;
  }

  console.log('\n✂️ Chunking documents...');
  const chunks = processDocuments(documents, chunkSize, chunkOverlap);

  console.log('\n🔢 Generating embeddings...');
  const texts = chunks.map(c => c.text);
  
  // Process in batches of 100
  const batchSize = 100;
  const allEmbeddings = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
    const embeddings = await getEmbeddings(batch, embeddingModel);
    allEmbeddings.push(...embeddings);
  }

  console.log('\n💾 Storing vectors...');
  vectorStore.clear();
  
  const items = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: allEmbeddings[i]
  }));
  
  vectorStore.add(items);
  
  console.log('\n✅ Ingestion complete!');
  const stats = vectorStore.stats();
  console.log(`   - ${stats.totalChunks} chunks from ${stats.sourceCount} documents`);
}

/**
 * Query the knowledge base
 */
export async function query(question, config) {
  const { topK, embeddingModel, chatModel } = config;
  
  // Get embedding for the question
  const queryEmbedding = await getEmbedding(question, embeddingModel);
  
  // Search for relevant chunks
  const results = vectorStore.search(queryEmbedding, topK);
  
  if (results.length === 0) {
    return {
      answer: "I don't have any knowledge base loaded. Please run ingestion first.",
      sources: []
    };
  }

  // Build context from retrieved chunks
  const context = results.map((r, i) => 
    `[Source: ${r.source}]\n${r.text}`
  ).join('\n\n---\n\n');

  // Generate answer using LLM
  const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use ONLY the information from the context to answer. If the context doesn't contain enough information, say so.
Be concise and direct in your answers.

Context:
${context}`;

  const answer = await chatCompletion(systemPrompt, question, chatModel);
  
  return {
    answer,
    sources: results.map(r => ({
      source: r.source,
      score: r.score.toFixed(3),
      preview: r.text.slice(0, 100) + '...'
    }))
  };
}
