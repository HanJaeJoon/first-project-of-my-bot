// 한국어 / 영어 혼용 텍스트를 문장 경계 기준으로 나눈 후
// 목표 chunkSize 에 맞춰 합치고 overlap 을 두는 청커.

const SENT_BOUNDARY = /([^\s].*?(?:다\.|요\.|죠\.|까\?|니다\.|니까\?|[.!?。！？…])(?:["'”’)\]]+)?)(\s+|$)/gs;

function splitSentences(text) {
  const sentences = [];
  let lastEnd = 0;
  for (const m of text.matchAll(SENT_BOUNDARY)) {
    sentences.push(m[1].trim());
    lastEnd = m.index + m[0].length;
  }
  const tail = text.slice(lastEnd).trim();
  if (tail) sentences.push(tail);
  return sentences.filter(Boolean);
}

function hardSplit(piece, size) {
  const out = [];
  for (let i = 0; i < piece.length; i += size) {
    out.push(piece.slice(i, i + size));
  }
  return out;
}

export function chunkText(text, chunkSize = 700, overlap = 100) {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
  if (!normalized.trim()) return [];

  const sentences = splitSentences(normalized).flatMap((s) =>
    s.length > chunkSize ? hardSplit(s, chunkSize) : [s]
  );

  const chunks = [];
  let buf = '';

  const flush = () => {
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

  const withOverlap = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1];
    const tail = prev.slice(Math.max(0, prev.length - overlap));
    withOverlap.push(`${tail} ${chunks[i]}`.trim());
  }
  return withOverlap;
}

export function processDocuments(documents, chunkSize, overlap) {
  const out = [];
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
