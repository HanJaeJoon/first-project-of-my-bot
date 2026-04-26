// 한국어 / 영어 혼용 텍스트를 문장 경계 기준으로 나눈 후
// 목표 chunkSize 에 맞춰 합치고 overlap 을 두는 청커.

import type { DocumentChunk, LoadedDocument } from './types.js';

const SENT_BOUNDARY =
  /([^\s].*?(?:다\.|요\.|죠\.|까\?|니다\.|니까\?|[.!?。！？…])(?:["'”’)\]]+)?)(\s+|$)/gs;

function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let lastEnd = 0;
  for (const m of text.matchAll(SENT_BOUNDARY)) {
    const captured = m[1];
    if (captured) sentences.push(captured.trim());
    lastEnd = (m.index ?? 0) + m[0].length;
  }
  const tail = text.slice(lastEnd).trim();
  if (tail) sentences.push(tail);
  return sentences.filter(Boolean);
}

function hardSplit(piece: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < piece.length; i += size) {
    out.push(piece.slice(i, i + size));
  }
  return out;
}

export function chunkText(
  text: string,
  chunkSize = 700,
  overlap = 100,
): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
  if (!normalized.trim()) return [];

  const sentences = splitSentences(normalized).flatMap((s) =>
    s.length > chunkSize ? hardSplit(s, chunkSize) : [s],
  );

  const chunks: string[] = [];
  let buf = '';

  const flush = (): void => {
    const trimmed = buf.trim();
    if (trimmed) chunks.push(trimmed);
    buf = '';
  };

  for (const s of sentences) {
    if (buf.length + s.length + 1 <= chunkSize) {
      buf += (buf ? ' ' : '') + s;
      continue;
    }
    flush();
    buf = s;
  }
  flush();

  if (overlap <= 0 || chunks.length <= 1) return chunks;

  const first = chunks[0];
  if (first === undefined) return chunks;

  const withOverlap: string[] = [first];
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1];
    const cur = chunks[i];
    if (prev === undefined || cur === undefined) continue;
    const tail = prev.slice(Math.max(0, prev.length - overlap));
    withOverlap.push(`${tail} ${cur}`.trim());
  }
  return withOverlap;
}

export function processDocuments(
  documents: LoadedDocument[],
  chunkSize: number,
  overlap: number,
): DocumentChunk[] {
  const out: DocumentChunk[] = [];
  for (const doc of documents) {
    const pieces = chunkText(doc.content, chunkSize, overlap);
    pieces.forEach((text, i) => {
      out.push({
        id: `${doc.filename}#${i}`,
        text,
        source: doc.filename,
        chunkIndex: i,
      });
    });
  }
  return out;
}
