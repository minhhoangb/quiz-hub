import { readAll } from './storage.js';

export function shuffle(items, random = Math.random) {
  const result = [...items];
  // Fisher–Yates: mỗi vị trí có xác suất được chọn như nhau, không sửa mảng gốc.
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createSession(subjectId, mode, count, allQuestionIds, answeredIds = []) {
  if (!['count', 'all'].includes(mode) || !allQuestionIds.length) throw new Error('Không có câu hỏi hợp lệ.');
  if (mode === 'count' && (!Number.isInteger(count) || count < 1 || count > allQuestionIds.length)) throw new Error(`Chọn từ 1 đến ${allQuestionIds.length} câu hỏi.`);
  let questionIds;
  if (mode === 'all') {
    // Học tất cả luôn lấy toàn bộ ngân hàng, kể cả câu đã trả lời.
    questionIds = shuffle(allQuestionIds);
  } else {
    const answered = new Set(answeredIds);
    const unseen = shuffle(allQuestionIds.filter(id => !answered.has(id)));
    // Khi thiếu câu mới, quay vòng câu đã học; không trùng câu trong cùng phiên.
    questionIds = [...unseen, ...shuffle(allQuestionIds.filter(id => answered.has(id)))].slice(0, count);
  }
  return { subjectId, createdAt: new Date().toISOString(), mode, totalPlanned: questionIds.length, questionIds, currentIndex: 0, answers: [], status: 'active' };
}

export function resumeSession(subjectId, state = readAll()) {
  // Khôi phục cả đáp án hiện tại để không phải trả lời lại sau khi mở app.
  return state.session?.status === 'active' && state.session.subjectId === subjectId ? state.session : null;
}

export function recordAnswer(session, questionId, chosen, correct) {
  if (session.status !== 'active' || session.questionIds[session.currentIndex] !== questionId || session.answers.some(answer => answer.questionId === questionId) || !Number.isInteger(chosen) || chosen < 0 || chosen > 3) return session;
  // App lưu session trả về cùng wrong/answeredIds trong một lần ghi nguyên tử.
  return { ...session, answers: [...session.answers, { questionId, chosen, correct }] };
}

export function finishSession(session, stats = {}) {
  if (session.status === 'done' || session.answers.length !== session.totalPlanned) return { session, stats };
  const previous = stats[session.subjectId] ?? { totalAnswered: 0, totalCorrect: 0, sessionsDone: 0 };
  return {
    session: { ...session, status: 'done' },
    stats: { ...stats, [session.subjectId]: {
      totalAnswered: previous.totalAnswered + session.answers.length,
      totalCorrect: previous.totalCorrect + session.answers.filter(answer => answer.correct).length,
      sessionsDone: previous.sessionsDone + 1,
    } },
  };
}
