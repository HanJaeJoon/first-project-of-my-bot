import readline from 'node:readline';

import { config } from './config.js';
import { status } from './ollama.js';
import { ingestDocuments, query } from './rag.js';
import { vectorStore } from './vectorStore.js';

interface CheckOptions {
  verbose?: boolean;
}

export async function checkSetup({ verbose = true }: CheckOptions = {}): Promise<boolean> {
  const s = await status();
  if (!s.ok) {
    if (verbose) {
      console.error(`Ollama not available: ${s.error}`);
      console.log('Start Ollama:  docker compose up -d  (또는 ollama serve)');
    }
    return false;
  }
  if (verbose) {
    console.log(`Ollama OK at ${config.ollamaBaseUrl}`);
    console.log(`  models: ${s.models?.join(', ') || '(none)'}`);
  }
  if (!s.hasEmbedding && verbose) {
    console.log(`Missing embedding model: ${s.embeddingModel}`);
    console.log(`  pnpm setup:models  또는  ollama pull ${s.embeddingModel}`);
  }
  if (!s.hasChat && verbose) {
    console.log(`Missing chat model: ${s.chatModel}`);
    console.log(`  pnpm setup:models  또는  ollama pull ${s.chatModel}`);
  }
  return Boolean(s.hasEmbedding && s.hasChat);
}

export async function chatMode(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const stats = vectorStore.stats();
  console.log('\nMini RAG Chatbot (Ollama, local)');
  console.log(`  LLM       : ${config.chatModel}`);
  console.log(`  Embedding : ${config.embeddingModel}`);
  console.log(
    stats.totalChunks
      ? `  Knowledge : ${stats.totalChunks} chunks / ${stats.sourceCount} sources`
      : '  Knowledge : (empty — run `pnpm ingest`)',
  );
  console.log('Commands: /quit /stats /sources /check\n');

  const ask = (): void => {
    rl.question('You> ', async (raw) => {
      const input = raw.trim();
      if (!input) return ask();

      if (input === '/quit' || input === '/exit') {
        rl.close();
        process.exit(0);
      }
      if (input === '/stats') {
        const s = vectorStore.stats();
        console.log(`  ${s.totalChunks} chunks / ${s.sourceCount} sources\n`);
        return ask();
      }
      if (input === '/sources') {
        const s = vectorStore.stats();
        console.log(`  ${s.sources.join(', ') || '(none)'}\n`);
        return ask();
      }
      if (input === '/check') {
        await checkSetup();
        console.log();
        return ask();
      }

      try {
        process.stdout.write('Bot> ');
        const result = await query(input, {
          stream: config.chatStream,
          onToken: (t) => process.stdout.write(t),
        });
        if (!config.chatStream) process.stdout.write(result.answer);
        process.stdout.write('\n');

        if (result.sources.length) {
          console.log('Sources:');
          result.sources.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.source}  (sim=${s.score})`);
          });
        }
        console.log();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nError: ${message}\n`);
      }
      ask();
    });
  };

  ask();
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
  const has = (flag: string): boolean => argv.includes(flag);

  if (has('--check')) {
    const ok = await checkSetup();
    process.exit(ok ? 0 : 1);
  }

  const ready = await checkSetup();
  if (!ready && !has('--force')) {
    console.log('\n--force 플래그로 무시하고 진행할 수 있습니다.');
    process.exit(1);
  }

  if (has('--ingest')) {
    await ingestDocuments();
    return;
  }
  await chatMode();
}
