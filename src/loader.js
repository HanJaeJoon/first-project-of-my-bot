import fs from 'fs';
import path from 'path';

/**
 * Load all text files from a directory
 */
export function loadDocuments(dirPath) {
  const documents = [];
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return documents;
  }

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && (file.endsWith('.txt') || file.endsWith('.md'))) {
      const content = fs.readFileSync(filePath, 'utf-8');
      documents.push({
        filename: file,
        content: content,
        path: filePath
      });
      console.log(`Loaded: ${file}`);
    }
  }
  
  return documents;
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start + overlap >= text.length) break;
  }
  
  return chunks;
}

/**
 * Process documents into chunks with metadata
 */
export function processDocuments(documents, chunkSize, overlap) {
  const allChunks = [];
  
  for (const doc of documents) {
    const chunks = chunkText(doc.content, chunkSize, overlap);
    
    for (let i = 0; i < chunks.length; i++) {
      allChunks.push({
        id: `${doc.filename}_chunk_${i}`,
        text: chunks[i],
        source: doc.filename,
        chunkIndex: i
      });
    }
  }
  
  console.log(`Created ${allChunks.length} chunks from ${documents.length} documents`);
  return allChunks;
}
