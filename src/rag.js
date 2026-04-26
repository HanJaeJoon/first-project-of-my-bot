import { config } from './config.js';
import { embed, embedMany, chat } from './ollama.js';
import { vectorStore } from './vectorStore.js';
import { loadDocuments } from './loader.js';
import { processDocuments } from './chunker.js';

const SYSTEM_PROMPT_KO = `당신은 주어진 컨텍스트만 근거로 답변하는 한국어 어시스턴트입니다.
규칙:
- 컨텍스트에 없는 내용은 "제공된 자료에서 찾을 수 없습니다."라고 답하세요.
- 가능하면 출처(파일명)를 인용하세요.
- 답변은 간결하고 정확하게, 한국어로 작성합니다.`;

function buildUserPrompt(question, results) {
  const ctx = results
    .map((r, i) => `[${i + 1}] (출처: ${r.source})\n${r.text}`)
    .join('\n\n---\n\n');
  return `# 컨텍스트\n${ctx}\n\n# 질문\n${question}`;
}

export async function ingestDocuments(knowledgeDir = config.knowledgeDir) {
  console.log('\nLoading documents...');
  const documents = loadDocuments(knowledgeDir);
  if (documents.length === 0) {
    console.log(`No documents in ${knowledgeDir}. Add .txt or .md files.`);
    return { ingested: 0 };
  }
  console.log(`  ${documents.length} files`);

  console.log('\nChunking...');
  const chunks = processDocuments(documents, config.chunkSize, config.chunkOverlap);
  console.log(`  ${chunks.length} chunks`);

  console.log(`\nEmbedding (${config.embeddingModel}, concurrency=${config.embedConcurrency})...`);
  const embeddings = await embedMany(
    chunks.map((c) => c.text),
    {
      onProgress: (done, total) => {
        const pct = Math.floor((done / total) * 100);
        process.stdout.write(`\r  ${pct}% (${done}/${total})`);
      },
    }
  );
  process.stdout.write('\n');

  vectorStore.replace(chunks.map((c, i) => ({ ...c, embedding: embeddings[i] })));
  const stats = vectorStore.stats();
  console.log(`\nIngested: ${stats.totalChunks} chunks from ${stats.sourceCount} sources.`);
  return { ingested: stats.totalChunks };
}

export async function query(question, { stream = config.chatStream, onToken } = {}) {
  const queryEmbedding = await embed(question);
  const results = vectorStore.search(queryEmbedding, config.topK);

  if (results.length === 0) {
    return {
      answer: '지식 베이스가 비어있습니다. 먼저 `npm run ingest` 를 실행하세요.',
      sources: [],
    };
  }

  const userPrompt = buildUserPrompt(question, results);
  const answer = await chat({
    system: SYSTEM_PROMPT_KO,
    user: userPrompt,
    stream,
    onToken,
  });

  return {
    answer,
    sources: results.map((r) => ({
      source: r.source,
      score: r.score.toFixed(3),
      preview: r.text.slice(0, 120),
    })),
  };
}
