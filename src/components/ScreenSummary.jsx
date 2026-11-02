import MathText from './MathText.jsx';
import { ArrowRight, Check, Layers, RotateCcw, Trophy } from 'lucide-react';
import { Back, Progress } from './UI.jsx';

export default function ScreenSummary({ subject, questions, session, wrongCount, remaining, onBack, onReview, onNew }) {
  const correct = session.answers.filter(answer => answer.correct).length;
  const wrong = session.answers.filter(answer => !answer.correct);
  const score = Math.round(correct / session.totalPlanned * 100);
  return <div className="narrow-screen animate-slide-up"><Back onClick={onBack} /><div className="summary-hero"><span className="trophy-icon animate-pop-in"><Trophy size={37} strokeWidth={1.5} /></span><div className="eyebrow">THÊM MỘT BƯỚC TIẾN</div><h1>Bạn đã làm rất tốt!</h1><p>{session.mode === 'all' ? `Bạn đã hoàn thành tất cả ${session.totalPlanned} câu hỏi trong phiên này 🎉` : `Bạn vừa hoàn thành phiên ${session.totalPlanned} câu hỏi của ${subject.name}.`}</p></div><section className="work-card"><div className="score-row"><div><span>KẾT QUẢ PHIÊN HỌC</span><strong>{correct}<small> / {session.totalPlanned}</small></strong><p>câu trả lời đúng</p></div><div className="score-ring" style={{ '--score': `${score}%` }}><span>{score}<small>%</small></span></div></div><Progress value={100} label="Phiên học đã hoàn thành" /><div className="summary-meta"><span><Check size={15} />Phiên học đã lưu</span><span>{remaining} câu chưa học · {wrongCount} câu trong bộ ôn tập</span></div><div className="summary-wrong"><h2>{wrong.length ? `${wrong.length} câu hỏi để hiểu sâu hơn` : 'Trọn vẹn một phiên học! ✨'}</h2>{wrong.length ? wrong.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    return question ? <article key={answer.questionId}><span className="wrong-dot" /><div><p><MathText>{question.question}</MathText></p><span>Đáp án đúng: <MathText>{question.options[question.correctAnswer]}</MathText></span></div></article> : null;
  }) : <p>Bạn đã trả lời đúng tất cả. Tiếp tục khám phá kiến thức mới nhé.</p>}</div><div className="summary-actions">{wrongCount > 0 && <button className="button primary" onClick={onReview}><Layers size={17} />Ôn câu sai ngay<ArrowRight size={17} /></button>}{remaining > 0 && <button className="button secondary" onClick={onNew}><RotateCcw size={16} />Bắt đầu phiên mới</button>}<button className="text-button" onClick={onBack}>Về danh sách môn học</button></div></section></div>;
}
