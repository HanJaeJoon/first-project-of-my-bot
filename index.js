import 'dotenv/config';
import readline from 'readline';
import { initOpenAI } from './src/embeddings.js';
import { ingestDocuments, query } from './src/rag.js';
import { vectorStore } from './src/vectorStore.js';

// Configuration
const config = {
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 500,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 50,
  topK: parseInt(process.env.TOP_K) || 3,
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  chatModel: process.env.CHAT_MODEL || 'gpt-4o-mini',
};

const KNOWLEDGE_DIR = './knowledge';

/**
 * Interactive chat mode
 */
async function chatMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 Mini RAG Chatbot');
  console.log('==================');
  
  const stats = vectorStore.stats();
  if (stats.totalChunks === 0) {
    console.log('⚠️  No knowledge base found. Run with --ingest first.');
  } else {
    console.log(`📚 Knowledge base: ${stats.totalChunks} chunks from ${stats.sourceCount} sources`);
  }
  
  console.log('\nCommands: /quit, /stats, /sources');
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
  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  initOpenAI(process.env.OPENAI_API_KEY);

  const args = process.argv.slice(2);

  if (args.includes('--ingest')) {
    // Ingest mode
    await ingestDocuments(KNOWLEDGE_DIR, config);
  } else if (args.includes('--chat') || args.length === 0) {
    // Chat mode (default)
    await chatMode();
  } else {
    console.log('Usage:');
    console.log('  npm run ingest  - Ingest documents from knowledge/ folder');
    console.log('  npm run chat    - Start interactive chat');
    console.log('  npm start       - Start interactive chat');
  }
}

main().catch(console.error);
