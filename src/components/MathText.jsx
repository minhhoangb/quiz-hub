import { parseMathText } from '../lib/mathText.js';

export default function MathText({ children }) {
  return <span className="math-copy">{parseMathText(children).map((part, index) => {
    if (part.type === 'text') return part.value;
    if (part.type === 'sqrt') return <math className="inline-math" key={index} aria-label={`Căn bậc hai của ${part.value}`}><msqrt><mtext>{part.value}</mtext></msqrt></math>;
    const matrix = part.rows.length > 1;
    const label = matrix ? `Ma trận ${part.rows.map(row => row.join(', ')).join('; ')}` : `Vectơ ${part.rows[0].join(', ')}`;
    return <math className="inline-math" key={index} aria-label={label}><mrow><mo>[</mo>{matrix
      ? <mtable>{part.rows.map((row, i) => <mtr key={i}>{row.map((number, j) => <mtd key={j}><mn>{number}</mn></mtd>)}</mtr>)}</mtable>
      : <mrow>{part.rows[0].map((number, i) => <mrow key={i}>{i > 0 && <mo>,</mo>}<mn>{number}</mn></mrow>)}</mrow>}<mo>]</mo></mrow></math>;
  })}</span>;
}
