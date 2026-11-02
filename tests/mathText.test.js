import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mathTextLabel, parseMathText } from '../src/lib/mathText.js';

const bank = JSON.parse(fs.readFileSync(new URL('../src/data/questions/mds_question.json', import.meta.url)));

test('renders the norm question as vector and mathematical formulas without changing source data', () => {
  const original = JSON.stringify(bank[0]);
  const parts = parseMathText(bank[0].question);
  assert.deepEqual(parts.find(part => part.type === 'array').rows, [[2, -3, 6]]);
  const label = mathTextLabel(bank[0].question);
  assert.ok(!label.includes('np.') && !label.includes('_norm'));
  assert.ok(label.includes('L₁ = Σᵢ |uᵢ|') && label.includes('L₂ = √(Σᵢ uᵢ²)'));
  assert.equal(mathTextLabel(bank[0].options[2]), 'L₁ = 11, L₂ = 7.0');
  assert.equal(JSON.stringify(bank[0]), original);
});

test('keeps element-wise matrix multiplication distinct from matrix multiplication', () => {
  const parts = parseMathText(bank[1].question);
  assert.deepEqual(parts.filter(part => part.type === 'array').map(part => part.rows), [[[2, 0], [1, 3]], [[1, 4], [2, 5]]]);
  assert.ok(mathTextLabel(bank[1].question).includes('X ⊙ Y (multiply corresponding entries)'));
  assert.ok(mathTextLabel(bank[1].explanation).includes('matrix product XY'));
  assert.deepEqual(parseMathText(bank[1].options[0])[0].rows, [[2, 0], [2, 15]]);
});

test('preserves code API questions, unknown text and unsafe or malformed arrays', () => {
  for (const text of ['arr[0] = 99.0', 'torch.from_numpy(arr)', 'np.array([[1, 2], [3]])', 'np.array([NaN, 2])', '<script>alert(1)</script>']) {
    assert.equal(mathTextLabel(text), text);
  }
  assert.deepEqual(parseMathText('np.array([-1.5, 2e-3])')[0].rows, [[-1.5, 0.002]]);
  assert.equal(parseMathText('sqrt(4 + 9 + 36)')[0].type, 'sqrt');
});
