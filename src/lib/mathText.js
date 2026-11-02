export function readableMathText(text) {
  return text
    .replace(/np\.sum\(np\.abs\(([a-zA-Z]\w*)\)\)/g, 'Σᵢ |$1ᵢ|')
    .replace(/np\.linalg\.norm\(([a-zA-Z]\w*)\)/g, '√(Σᵢ $1ᵢ²)')
    .replace(/\bl1_norm\b/g, 'L₁')
    .replace(/\bl2_norm\b/g, 'L₂')
    .replace(/\bL1 norm\b/g, 'L₁ norm')
    .replace(/\bL2 norm\b/g, 'L₂ norm')
    .replace(/\b([A-Z]) \* ([A-Z]) in NumPy\b/g, '$1 ⊙ $2 (multiply corresponding entries)')
    .replace(/\b([A-Z]) \* ([A-Z]) is element-wise\b/g, '$1 ⊙ $2 is element-wise')
    .replace(/\bx_ij \* y_ij\b/g, 'xᵢⱼ × yᵢⱼ')
    .replace(/\b([A-Z]) @ ([A-Z])\b/g, '$1$2');
}

export function parseMathText(text) {
  const value = readableMathText(text);
  const number = '-?(?:\\d+(?:\\.\\d+)?)(?:[eE][+-]?\\d+)?';
  const vector = `\\[\\s*${number}(?:\\s*,\\s*${number})*\\s*\\]`;
  const array = `(?:\\[\\s*${vector}(?:\\s*,\\s*${vector})*\\s*\\]|${vector})`;
  const pattern = new RegExp(`np\\.array\\(\\s*(${array})\\s*\\)|(${array})|(?:sqrt|√)\\(([^()]*)\\)`, 'g');
  const parts = [];
  let end = 0;
  for (const match of value.matchAll(pattern)) {
    let part;
    if (match[3] !== undefined) part = { type: 'sqrt', value: match[3] };
    else {
      try {
        const array = JSON.parse(match[1] ?? match[2]);
        const rows = Array.isArray(array[0]) ? array : [array];
        if ((!match[1] && !match[2].includes(',')) || !rows[0]?.length || !rows.every(row => Array.isArray(row) && row.length === rows[0].length && row.every(Number.isFinite))) continue;
        part = { type: 'array', rows };
      } catch { continue; }
    }
    if (match.index > end) parts.push({ type: 'text', value: value.slice(end, match.index) });
    parts.push(part);
    end = match.index + match[0].length;
  }
  if (end < value.length) parts.push({ type: 'text', value: value.slice(end) });
  return parts;
}

export function mathTextLabel(text) {
  return parseMathText(text).map(part => part.type === 'array'
    ? `[${part.rows.map(row => row.join(', ')).join('; ')}]`
    : part.type === 'sqrt' ? `√(${part.value})` : part.value).join('');
}
