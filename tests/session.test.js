import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import subjects from '../src/data/subjects.js';
import { createSession, finishSession, recordAnswer, resumeSession, shuffle } from '../src/lib/session.js';
import { addWrong, getWrongIds, hasActiveSession, initialState, readAll, removeWrong, writeAll } from '../src/lib/storage.js';

test('shuffle preserves input and produces a permutation, including edge cases', () => {
  const ids = [1, 2, 3, 4];
  assert.deepEqual(shuffle(ids, () => 0), [2, 3, 4, 1]);
  assert.deepEqual(ids, [1, 2, 3, 4]);
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle([1]), [1]);
});

test('count sessions prefer unseen questions and cycle without duplicates', () => {
  const session = createSession('ml', 'count', 4, [1, 2, 3, 4, 5], [1, 2, 3]);
  assert.deepEqual(session.questionIds.slice(0, 2).sort(), [4, 5]);
  assert.equal(new Set(session.questionIds).size, 4);
  assert.equal(session.totalPlanned, 4);
  for (const count of [0, -1, 1.5, 6, NaN]) assert.throws(() => createSession('ml', 'count', count, [1, 2, 3, 4, 5]));
});

test('all mode includes every ID regardless of previously answered questions', () => {
  const session = createSession('network', 'all', 1, [1, 2, 3, 4], [1, 2]);
  assert.equal(session.mode, 'all');
  assert.equal(session.totalPlanned, 4);
  assert.deepEqual(session.questionIds.toSorted(), [1, 2, 3, 4]);
  assert.throws(() => createSession('ml', 'all', 0, []));
});

test('answer recording guards against repeated, invalid and out-of-order answers', () => {
  const session = createSession('ml', 'count', 1, [7]);
  assert.equal(recordAnswer(session, 8, 0, true), session);
  assert.equal(recordAnswer(session, 7, 4, true), session);
  const answered = recordAnswer(session, 7, 2, false);
  assert.equal(answered.currentIndex, 0);
  assert.deepEqual(answered.answers, [{ questionId: 7, chosen: 2, correct: false }]);
  assert.equal(recordAnswer(answered, 7, 1, true), answered);
});

test('resume and finalization preserve state and count completed sessions once', () => {
  const session = createSession('ml', 'count', 1, [1]);
  const state = { ...initialState, session };
  assert.equal(resumeSession('ml', state), session);
  assert.equal(resumeSession('network', state), null);
  assert.equal(hasActiveSession('ml', state), true);
  assert.equal(finishSession(session).session.status, 'active');
  const answered = recordAnswer(session, 1, 1, true);
  const first = finishSession(answered);
  assert.equal(first.session.status, 'done');
  assert.deepEqual(first.stats.ml, { totalAnswered: 1, totalCorrect: 1, sessionsDone: 1 });
  assert.deepEqual(finishSession(first.session, first.stats), first);
});

test('wrong pools are deduplicated, isolated by subject and removable', () => {
  let state = addWrong('ml', 1, structuredClone(initialState));
  state = addWrong('ml', 1, state);
  state = addWrong('network', 1, state);
  assert.deepEqual(getWrongIds('ml', state), [1]);
  state = removeWrong('ml', 1, state);
  assert.deepEqual(getWrongIds('ml', state), []);
  assert.deepEqual(getWrongIds('network', state), [1]);
});

test('storage is safe without window and recovers malformed JSON', () => {
  assert.equal(writeAll(initialState), false);
  assert.deepEqual(readAll(), initialState);
  const saved = new Map();
  globalThis.window = { localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } };
  try {
    const state = { ...initialState, reviewIndex: { ml: 2 }, reviewFlipped: { ml: true } };
    assert.equal(writeAll(state), true);
    assert.equal(saved.size, 1);
    assert.deepEqual(readAll(), state);
    saved.set('quiz_practice_v1', '{bad');
    assert.deepEqual(readAll(), initialState);
    saved.set('quiz_practice_v1', JSON.stringify({ wrong: null, session: {} }));
    assert.deepEqual(readAll(), initialState);
    saved.set('quiz_practice_v1', JSON.stringify({ wrong: { ml: 'bad', network: [1, 1, null] }, reviewIndex: { ml: -2 }, stats: { ml: {} } }));
    assert.deepEqual(readAll().wrong, { ml: [], network: [1] });
    assert.equal(readAll().reviewIndex.ml, 0);
    assert.deepEqual(readAll().stats, {});
    addWrong('ml', 7);
    assert.deepEqual(getWrongIds('ml'), [7]);
    removeWrong('ml', 7);
    assert.deepEqual(getWrongIds('ml'), []);
    window.localStorage.setItem = () => { throw new Error('Quota'); };
    assert.equal(writeAll(state), false);
  } finally { delete globalThis.window; }
});

test('every registered subject has a valid question bank with unique IDs and all difficulties', () => {
  assert.equal(new Set(subjects.map(subject => subject.id)).size, subjects.length);
  for (const { file } of subjects) {
    const questions = JSON.parse(fs.readFileSync(new URL(`../src/data/questions/${file}.json`, import.meta.url)));
    assert.ok(questions.length >= 5);
    assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
    assert.equal(new Set(questions.map(q => q.difficulty)).size, 3);
    for (const q of questions) {
      assert.equal(typeof q.id, 'number');
      assert.equal(q.options.length, 4);
      assert.ok(q.options.every(option => typeof option === 'string' && option.trim()));
      assert.ok(['Easy', 'Medium', 'Hard'].includes(q.difficulty));
      assert.ok(Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < 4);
      assert.ok(q.topic && q.question && q.explanation);
    }
  }
});
