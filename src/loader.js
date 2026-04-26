import fs from 'node:fs';
import path from 'node:path';

const SUPPORTED = new Set(['.txt', '.md']);

export function loadDocuments(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return [];
  }

  const docs = [];
  const walk = (cur) => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && SUPPORTED.has(path.extname(entry.name).toLowerCase())) {
        const rel = path.relative(dirPath, full);
        docs.push({
          filename: rel,
          path: full,
          content: fs.readFileSync(full, 'utf-8'),
        });
      }
    }
  };
  walk(dirPath);
  return docs;
}
