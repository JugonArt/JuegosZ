const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'hooks1942', 'useGameLoop.js');
const s = fs.readFileSync(file, 'utf8');
let stack = [];
let line = 1, col = 0;
let inSingle = false, inDouble = false, inBack = false, inLineComment = false, inBlockComment = false;
const snapLines = new Set([720,760,800,840,880,920,960,984]);
function snap(line, col, stack){
  console.log('\n--- SNAP at '+line+':'+col+' ---');
  console.log(stack.map((x,i)=>`${i}: ${x.ch} opened at ${x.line}:${x.col}`).join('\n'));
}
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  col++;
  if (ch === '\n') {
    line++;
    col = 0;
    inLineComment = false;
    if (snapLines.has(line)) snap(line, col, stack.slice());
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
  if (inSingle || inDouble || inBack) { if (ch === '\\') { i++; col++; } continue; }
  if (ch === '(' || ch === '{' || ch === '[') { stack.push({ ch, line, col }); continue; }
  if (ch === ')' || ch === '}' || ch === ']') {
    const last = stack[stack.length-1];
    const popped = stack.pop();
    if (!popped) { console.log(`UNMATCHED_CLOSING ${ch} at ${line}:${col}`); break; }
  }
}
console.log('\nDONE');
