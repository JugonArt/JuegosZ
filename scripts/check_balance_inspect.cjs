const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'hooks1942', 'useGameLoop.js');
const s = fs.readFileSync(file, 'utf8');
let stack = [];
let line = 1, col = 0;
let inSingle = false, inDouble = false, inBack = false, inLineComment = false, inBlockComment = false;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  col++;
  if (ch === '\n') {
    line++;
    col = 0;
    inLineComment = false;
    continue;
  }
  if (inLineComment) continue;
  if (inBlockComment) {
    if (ch === '*' && s[i + 1] === '/') { inBlockComment = false; i++; col++; }
    continue;
  }
  if (!inSingle && !inDouble && !inBack && ch === '/' && s[i + 1] === '/') { inLineComment = true; i++; col++; continue; }
  if (!inSingle && !inDouble && !inBack && ch === '/' && s[i + 1] === '*') { inBlockComment = true; i++; col++; continue; }
  if (!inDouble && !inBack && ch === "'") { inSingle = !inSingle; continue; }
  if (!inSingle && !inBack && ch === '"') { inDouble = !inDouble; continue; }
  if (!inSingle && !inDouble && ch === '`') { inBack = !inBack; continue; }
  if (inSingle || inDouble || inBack) {
    if (ch === '\\') { i++; col++; }
    continue;
  }
  if (ch === '(' || ch === '{' || ch === '[') { stack.push({ ch, line, col }); continue; }
  if (ch === ')' || ch === '}' || ch === ']') {
    const last = stack[stack.length-1];
    console.log(`Encounter closing '${ch}' at ${line}:${col}, stackTop=${last?last.ch+'@'+last.line+':'+last.col:'<empty>'}, stackLen=${stack.length}`);
    const popped = stack.pop();
    if (!popped) { console.log(`UNMATCHED_CLOSING ${ch} at ${line}:${col}`); process.exit(2); }
    const match = (popped.ch === '(' && ch === ')') || (popped.ch === '{' && ch === '}') || (popped.ch === '[' && ch === ']');
    if (!match) { console.log(`MISMATCH ${popped.ch} opened at ${popped.line}:${popped.col} but closed by ${ch} at ${line}:${col}`); process.exit(3); }
  }
}
if (stack.length) { const last = stack[stack.length - 1]; console.log(`UNCLOSED ${last.ch} opened at ${last.line}:${last.col}`); process.exit(4); }
console.log('OK');
