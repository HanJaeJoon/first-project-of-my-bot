import 'dotenv/config';
import readline from 'readline';
import { initOllama, checkOllama } from './src/embeddings.js';
import { ingestDocuments, query } from './src/rag.js';
import { vectorStore } from './src/vectorStore.js';

// Configuration
const config = {
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 500,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 50,
  topK: parseInt(process.env.TOP_K) || 3,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  chatModel: process.env.CHAT_MODEL || 'qwen2.5:3b',
};

const KNOWLEDGE_DIR = './knowledge';

/**
 * Check Ollama status and models
 */
async function checkSetup() {
  console.log('\n🔍 Checking Ollama setup...');
  
  const status = await checkOllama();
  
  if (!status.ok) {
    console.error(`❌ Ollama not available: ${status.error}`);
    console.log('\nMake sure Ollama is running:');
    console.log('  docker-compose up -d');
    console.log('  # or');
    console.log('  ollama serve');
    return false;
  }

  console.log(`✅ Ollama connected at ${config.ollamaBaseUrl}`);
  console.log(`   Available models: ${status.models.join(', ') || 'none'}`);
  
  if (!status.hasEmbedding) {
    console.log(`\n⚠️  Embedding model '${status.embeddingModel}' not found.`);
    console.log(`   Run: ollama pull ${status.embeddingModel}`);
  }
  
  if (!status.hasChat) {
    console.log(`\n⚠️  Chat model '${status.chatModel}' not found.`);
    console.log(`   Run: ollama pull ${status.chatModel}`);
  }

  return status.hasEmbedding && status.hasChat;
}

/**
 * Interactive chat mode
 */
async function chatMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 Mini RAG Chatbot (Local Ollama)');
  console.log('==================================');
  console.log(`   LLM: ${config.chatModel}`);
  console.log(`   Embeddings: ${config.embeddingModel}`);
  
  const stats = vectorStore.stats();
  if (stats.totalChunks === 0) {
    console.log('\n⚠️  No knowledge base found. Run with --ingest first.');
  } else {
    console.log(`\n📚 Knowledge base: ${stats.totalChunks} chunks from ${stats.sourceCount} sources`);
  }
  
  console.log('\nCommands: /quit, /stats, /sources, /check');
  console.log('Ask anything about your knowledge base!\n');

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        askQuestion();
        return;
      }

      // Handle commands
      if (trimmed === '/quit' || trimmed === '/exit') {
        console.log('Goodbye! 👋');
        rl.close();
        process.exit(0);
      }

      if (trimmed === '/stats') {
        const s = vectorStore.stats();
        console.log(`\n📊 Stats: ${s.totalChunks} chunks, ${s.sourceCount} sources\n`);
        askQuestion();
        return;
      }

      if (trimmed === '/sources') {
        const s = vectorStore.stats();
        console.log(`\n📁 Sources: ${s.sources.join(', ') || 'none'}\n`);
        askQuestion();
        return;
      }

      if (trimmed === '/check') {
        await checkSetup();
        console.log('');
        askQuestion();
        return;
      }

      // Query the knowledge base
      try {
        console.log('\n🔍 Searching...');
        const result = await query(trimmed, config);
        
        console.log(`\n🤖 Assistant: ${result.answer}`);
        
        if (result.sources.length > 0) {
          console.log('\n📎 Sources:');
          result.sources.forEach((s, i) => {
            console.log(`   ${i+1}. ${s.source} (relevance: ${s.score})`);
          });
        }
        console.log('');
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Main entry point
 */
async function main() {
  // Initialize Ollama
  initOllama(config.ollamaBaseUrl, config.embeddingModel, config.chatModel);

  const args = process.argv.slice(2);

  if (args.includes('--check')) {
    // Check mode
    await checkSetup();
    process.exit(0);
  }

  // Verify Ollama is ready
  const ready = await checkSetup();
  if (!ready && !args.includes('--force')) {
    console.log('\nRun with --force to continue anyway, or fix the issues above.');
    process.exit(1);
  }

  if (args.includes('--ingest')) {
    // Ingest mode
    await ingestDocuments(KNOWLEDGE_DIR, config);
  } else if (args.includes('--chat') || args.length === 0 || args.includes('--force')) {
    // Chat mode (default)
    await chatMode();
  } else {
    console.log('Usage:');
    console.log('  npm run ingest  - Ingest documents from knowledge/ folder');
    console.log('  npm run chat    - Start interactive chat');
    console.log('  npm run check   - Check Ollama setup');
    console.log('  npm start       - Start interactive chat');
  }
}

main().catch(console.error);
