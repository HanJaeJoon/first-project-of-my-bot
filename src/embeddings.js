/**
 * Ollama API wrapper for embeddings and chat
 * Uses local Ollama instance - no API key required
 */

let config = {
  baseUrl: 'http://localhost:11434',
  embeddingModel: 'nomic-embed-text',
  chatModel: 'qwen2.5:3b'
};

export function initOllama(baseUrl, embeddingModel, chatModel) {
  config.baseUrl = baseUrl || config.baseUrl;
  config.embeddingModel = embeddingModel || config.embeddingModel;
  config.chatModel = chatModel || config.chatModel;
}

/**
 * Generate embedding for a single text
 */
export async function getEmbedding(text) {
  const response = await fetch(`${config.baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.embeddingModel,
      prompt: text
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function getEmbeddings(texts) {
  const embeddings = [];
  
  for (const text of texts) {
    const embedding = await getEmbedding(text);
    embeddings.push(embedding);
  }
  
  return embeddings;
}

/**
 * Chat completion with context
 */
export async function chatCompletion(systemPrompt, userMessage) {
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 1000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}

/**
 * Check if Ollama is running and models are available
 */
export async function checkOllama() {
  try {
    const response = await fetch(`${config.baseUrl}/api/tags`);
    if (!response.ok) return { ok: false, error: 'Ollama not responding' };
    
    const data = await response.json();
    const models = data.models?.map(m => m.name) || [];
    
    const hasEmbedding = models.some(m => m.includes(config.embeddingModel.split(':')[0]));
    const hasChat = models.some(m => m.includes(config.chatModel.split(':')[0]));
    
    return {
      ok: true,
      models,
      hasEmbedding,
      hasChat,
      embeddingModel: config.embeddingModel,
      chatModel: config.chatModel
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
