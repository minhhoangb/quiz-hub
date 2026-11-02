import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { editedFilename, getEditedBank, questionsForDifficulty, validateQuestions } from '../src/lib/questionBank.js';
import { createSession } from '../src/lib/session.js';

const original = JSON.parse(fs.readFileSync(new URL('../src/data/questions/mds_questions.json', import.meta.url)));

test('difficulty selection gives exact totals and sessions never include another difficulty', () => {
  const copy = JSON.stringify(original);
  const counts = [];
  for (const level of ['Easy', 'Medium', 'Hard']) {
    const questions = questionsForDifficulty(original, level);
    counts.push(questions.length);
    const ids = questions.map(q => q.id);
    assert.ok(ids.length > 0);
    for (const mode of ['count', 'all']) {
      const session = createSession('mds', mode, 5, ids, ids.slice(0, 3));
      assert.equal(session.totalPlanned, mode === 'all' ? ids.length : 5);
      assert.ok(session.questionIds.every(id => questions.find(q => q.id === id)?.difficulty === level));
    }
  }
  assert.equal(counts.reduce((sum, count) => sum + count, 0), original.length);
  assert.deepEqual(questionsForDifficulty([], 'Easy'), []);
  assert.deepEqual(questionsForDifficulty([{ id: 1, difficulty: 'Hard' }], 'Easy'), []);
  assert.equal(JSON.stringify(original), copy);
});

test('edited banks retain the original JSON schema and do not mutate the original', () => {
  assert.equal(validateQuestions(original), '');
  const edited = structuredClone(original);
  edited[0].question = 'Câu hỏi đã chỉnh sửa?';
  edited[0].options[2] = 'Đáp án tiếng Việt';
  edited[0].correctAnswer = 2;
  edited.splice(1, 1);
  edited.push({ ...structuredClone(edited[0]), id: Math.max(...original.map(q => q.id)) + 1, question: 'Câu hỏi mới?' });
  assert.equal(validateQuestions(edited), '');
  assert.notEqual(original[0].question, edited[0].question);
  assert.deepEqual(Object.keys(edited[0]), Object.keys(original[0]));
  assert.deepEqual(JSON.parse(JSON.stringify(edited)), edited);
  assert.equal(editedFilename('mds_questions'), 'mds_questions_edited.json');
  assert.equal(editedFilename('mds_questions.json'), 'mds_questions_edited.json');
});

test('studying all questions includes the entire bank across all three difficulties', () => {
  const session = createSession('mds', 'all', 5, original.map(q => q.id));
  assert.equal(session.totalPlanned, original.length);
  assert.deepEqual(new Set(session.questionIds.map(id => original.find(q => q.id === id).difficulty)), new Set(['Easy', 'Medium', 'Hard']));
});

test('only valid saved edits expose the edited source, including an intentionally empty bank', () => {
  assert.equal(getEditedBank({}, 'mds'), null);
  for (const value of [null, 'bad', {}, { questions: 'bad' }, { questions: [null] }]) {
    assert.equal(getEditedBank({ mds: value }, 'mds'), null);
  }
  const saved = { questions: original, useEdited: false };
  assert.equal(getEditedBank({ mds: saved }, 'mds'), saved);
  assert.ok(getEditedBank({ mds: { questions: [], useEdited: true } }, 'mds'));
});

test('rejects duplicate IDs, missing content, invalid answers and malformed options', () => {
  for (const change of [{ id: -1 }, { id: 1.5 }, { question: ' ' }, { explanation: '' }, { difficulty: 'Unknown' }, { options: ['A'] }, { options: ['', 'B', 'C', 'D'] }, { correctAnswer: -1 }, { correctAnswer: 4 }, { correctAnswer: '1' }]) {
    assert.ok(validateQuestions([{ ...original[0], ...change }]));
  }
  assert.ok(validateQuestions([original[0], original[0]]));
});
