import { mathTextLabel } from '../lib/mathText.js';
import MathText from './MathText.jsx';
import { useEffect } from 'react';
import { ArrowRight, Check, CircleCheck, CircleX, Lightbulb, Pause, Layers } from 'lucide-react';
import { Back, Progress } from './UI.jsx';

const difficulties = { Easy: 'Cơ bản', Medium: 'Trung bình', Hard: 'Nâng cao' };

export default function ScreenQuiz({ subject, questions, session, wrongCount, remaining, onBack, onAnswer, onNext }) {
  const question = questions.find(item => item.id === session.questionIds[session.currentIndex]);
  const answer = session.answers.find(item => item.questionId === question?.id);
  useEffect(() => {
    function handleKey(event) {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if (/^[1-4]$/.test(event.key) && !answer && question) { event.preventDefault(); onAnswer(question, Number(event.key) - 1); }
      if (event.key === 'Enter' && answer && (event.target.tagName !== 'BUTTON' || event.target.disabled)) { event.preventDefault(); onNext(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answer, question, onAnswer, onNext]);
  if (!question) return <div className="narrow-screen"><Back onClick={onBack} /><div className="work-card"><h1>Câu hỏi đã thay đổi</h1><p>Ngân hàng không còn câu hỏi này. Hãy tạo phiên mới để tiếp tục.</p></div></div>;
  const levelLabel = difficulties[session.difficulty];
  const last = session.currentIndex === session.totalPlanned - 1;
  return <div className="quiz-screen animate-fade-in"><div className="quiz-top"><Back onClick={onBack} /><button className="button quiet small" onClick={onBack}><Pause size={15} />Tạm dừng</button></div><div className="quiz-subject"><span>{subject.icon} {subject.name}</span><span className="soft-badge">{session.mode === 'all' ? 'Học tất cả' : 'Phiên luyện tập'}{levelLabel && <> · {levelLabel}</>}</span></div><div className="quiz-progress-label"><strong>Câu hỏi {session.currentIndex + 1}<span> / {session.totalPlanned}</span></strong><span>{session.answers.length} câu đã trả lời</span></div><Progress value={session.answers.length / session.totalPlanned * 100} label="Tiến độ phiên học" /><article className="work-card question-card" key={question.id}><div className="question-tags"><span className="soft-badge">{question.topic}</span><span className={`difficulty difficulty-${question.difficulty}`}>{difficulties[question.difficulty]}</span></div><h1><MathText>{question.question}</MathText></h1><p className="question-instruction">Chọn một đáp án đúng nhất.</p><div className="answer-options">{question.options.map((option, index) => {
    const correct = answer && index === question.correctAnswer;
    const incorrect = answer && index === answer.chosen && !answer.correct;
    return <button key={index} className={`answer-option ${correct ? 'correct' : ''} ${incorrect ? 'incorrect animate-answer-pulse' : ''}`} disabled={Boolean(answer)} aria-label={`${index + 1}. ${mathTextLabel(option)}${correct ? '. Đáp án đúng' : incorrect ? '. Đáp án đã chọn, chưa đúng' : ''}`} onClick={() => onAnswer(question, index)}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span><MathText>{option}</MathText></span>{correct ? <CircleCheck size={21} /> : incorrect ? <CircleX size={21} /> : <kbd>{index + 1}</kbd>}</button>;
  })}</div>{answer && <div className={`answer-feedback animate-slide-up ${answer.correct ? 'feedback-correct' : 'feedback-wrong'}`} role="status"><strong>{answer.correct ? <><Check size={19} />Chính xác! Thêm một điều bạn đã nắm vững.</> : <><Lightbulb size={19} />Chưa đúng — mình cùng ghi nhớ nhé.</>}</strong><p><MathText>{question.explanation}</MathText></p>{!answer.correct && <span><Layers size={13} />Đã thêm vào bộ thẻ ôn tập của môn học.</span>}</div>}<div className="question-footer"><span className="keyboard-tip">Phím <kbd>1</kbd>–<kbd>4</kbd> để chọn · <kbd>Enter</kbd> tiếp tục</span><button className="button primary" disabled={!answer} onClick={onNext}>{last ? 'Xem kết quả' : 'Câu tiếp theo'}<ArrowRight size={17} /></button></div></article><div className="quiz-bottom"><span><Layers size={14} />{wrongCount} câu cần ôn tập</span><span>{remaining} câu chưa học {levelLabel ? "ở mức " + levelLabel : "trong môn này"}</span><span className="save-dot">Đã lưu tiến độ</span></div></div>;
}
