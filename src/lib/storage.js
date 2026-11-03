export const STORAGE_KEY = 'quiz_practice_v1';
export const initialState = {
  session: null, wrong: {}, reviewIndex: {}, stats: {},
  answeredIds: {}, reviewFlipped: {}, wrongCounts: {},
};

export function readAll() {
  if (typeof window === 'undefined') return structuredClone(initialState);
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return structuredClone(initialState);
    const state = { ...structuredClone(initialState), ...raw };
    for (const key of ['wrong', 'reviewIndex', 'stats', 'answeredIds', 'reviewFlipped', 'wrongCounts']) {
      if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
    }
    for (const key of ['wrong', 'answeredIds']) {
      state[key] = Object.fromEntries(Object.entries(state[key]).map(([id, ids]) => [id, Array.isArray(ids) ? [...new Set(ids.filter(Number.isFinite))] : []]));
    }
    state.wrongCounts = Object.fromEntries(Object.entries(state.wrongCounts).map(([subjectId, counts]) => [subjectId,
      counts && typeof counts === 'object' && !Array.isArray(counts)
        ? Object.fromEntries(Object.entries(counts).filter(([, count]) => Number.isSafeInteger(count) && count > 0)) : {},
    ]));
    // Dữ liệu cũ chỉ lưu câu sai, nên bắt đầu từ một lần sai đã biết.
    for (const [subjectId, ids] of Object.entries(state.wrong)) {
      const counts = { ...state.wrongCounts[subjectId] };
      for (const id of ids) counts[id] ??= 1;
      state.wrongCounts = { ...state.wrongCounts, [subjectId]: counts };
    }
    state.reviewIndex = Object.fromEntries(Object.entries(state.reviewIndex).map(([id, index]) => [id, Number.isInteger(index) && index >= 0 ? index : 0]));
    state.stats = Object.fromEntries(Object.entries(state.stats).filter(([, stats]) => stats && ['totalAnswered', 'totalCorrect', 'sessionsDone'].every(key => Number.isFinite(stats[key]) && stats[key] >= 0)));
    if (state.session && (!Array.isArray(state.session.questionIds) || !state.session.questionIds.length || !Array.isArray(state.session.answers) || !Number.isInteger(state.session.currentIndex) || state.session.currentIndex < 0 || state.session.currentIndex >= state.session.questionIds.length || state.session.totalPlanned !== state.session.questionIds.length || !['active', 'done'].includes(state.session.status))) state.session = null;
    return state;
  } catch { return structuredClone(initialState); }
}

export function writeAll(state) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

export function getWrongIds(subjectId, state = readAll()) {
  return Array.isArray(state.wrong[subjectId]) ? state.wrong[subjectId] : [];
}

export function getWrongCount(subjectId, questionId, state = readAll()) {
  return state.wrongCounts?.[subjectId]?.[questionId] ?? (getWrongIds(subjectId, state).includes(questionId) ? 1 : 0);
}

// Ghi toàn bộ gốc dữ liệu; Set ngăn câu sai bị thêm trùng.
export function addWrong(subjectId, questionId, state) {
  const source = state ?? readAll();
  const next = {
    ...source,
    wrong: { ...source.wrong, [subjectId]: [...new Set([...getWrongIds(subjectId, source), questionId])] },
    wrongCounts: { ...source.wrongCounts, [subjectId]: { ...source.wrongCounts?.[subjectId], [questionId]: getWrongCount(subjectId, questionId, source) + 1 } },
  };
  if (!state) writeAll(next);
  return next;
}

export function removeWrong(subjectId, questionId, state) {
  const source = state ?? readAll();
  const next = { ...source, wrong: { ...source.wrong, [subjectId]: getWrongIds(subjectId, source).filter(id => id !== questionId) } };
  if (!state) writeAll(next);
  return next;
}

export function hasActiveSession(subjectId, state = readAll()) {
  return state.session?.status === 'active' && state.session.subjectId === subjectId;
}
