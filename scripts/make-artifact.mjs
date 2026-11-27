// Turns the single-file build into the shape the claude.ai Artifact host
// expects: page content only, because the host supplies doctype, head and body.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';
const keepHead = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .trim();

// <title> must sit in the first 8 KB, so keep it first.
const title = keepHead.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '';
const rest = keepHead.replace(title, '');
writeFileSync('dist/artifact.html', `${title}\n${rest}\n${body}`);
console.log(`dist/artifact.html written (${(Buffer.byteLength(title + rest + body) / 1024).toFixed(0)} KB)`);
