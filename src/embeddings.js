import OpenAI from 'openai';

let openai = null;

export function initOpenAI(apiKey) {
  openai = new OpenAI({ apiKey });
}

/**
 * Generate embedding for a single text
 */
export async function getEmbedding(text, model = 'text-embedding-3-small') {
  if (!openai) throw new Error('OpenAI not initialized');
  
  const response = await openai.embeddings.create({
    model: model,
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function getEmbeddings(texts, model = 'text-embedding-3-small') {
  if (!openai) throw new Error('OpenAI not initialized');
  
  const response = await openai.embeddings.create({
    model: model,
    input: texts,
  });
  
  return response.data.map(d => d.embedding);
}

/**
 * Chat completion with context
 */
export async function chatCompletion(systemPrompt, userMessage, model = 'gpt-4o-mini') {
  if (!openai) throw new Error('OpenAI not initialized');
  
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });
  
  return response.choices[0].message.content;
}
