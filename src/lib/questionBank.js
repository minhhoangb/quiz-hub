export const EDITED_BANKS_KEY = 'quiz_edited_banks_v1';

export function questionsForDifficulty(questions, difficulty) {
  return questions.filter(question => question.difficulty === difficulty);
}

export function validateQuestions(questions) {
  if (!Array.isArray(questions)) return 'Ngân hàng câu hỏi phải là một mảng.';
  const ids = new Set();
  for (const [index, question] of questions.entries()) {
    const label = `Câu ${index + 1}`;
    if (!question || !Number.isSafeInteger(question.id) || question.id < 1 || ids.has(question.id)) return `${label}: ID phải là số nguyên dương và không trùng.`;
    ids.add(question.id);
    if (['topic', 'question', 'explanation'].some(key => typeof question[key] !== 'string' || !question[key].trim())) return `${label}: hãy nhập chủ đề, câu hỏi và giải thích.`;
    if (!['Easy', 'Medium', 'Hard'].includes(question.difficulty)) return `${label}: mức độ không hợp lệ.`;
    if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some(option => typeof option !== 'string' || !option.trim())) return `${label}: cần đủ 4 đáp án.`;
    if (!Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer > 3) return `${label}: hãy chọn đáp án đúng.`;
  }
  return '';
}

export function getEditedBank(editedBanks, subjectId) {
  const edited = editedBanks?.[subjectId];
  return edited && !validateQuestions(edited.questions) ? edited : null;
}

export function editedFilename(file) {
  return `${file.replace(/\.json$/i, '')}_edited.json`;
}

export function downloadQuestions(file, questions) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(questions, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = editedFilename(file);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
