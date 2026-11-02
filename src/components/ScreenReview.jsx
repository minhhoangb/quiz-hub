import { useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { Back, Progress } from './UI.jsx';

export default function ScreenReview({ subject, questions, state, onBack, onFlip, onMove, onRemember }) {
  const ids = (state.wrong[subject.id] ?? []).filter(id => questions.some(question => question.id === id));
  const index = (state.reviewIndex[subject.id] ?? 0) % (ids.length || 1);
  const question = questions.find(q => q.id === ids[index]);
  const flipped = Boolean(state.reviewFlipped[subject.id]);
  const remaining = questions.filter(question => !(state.answeredIds[subject.id] ?? []).includes(question.id)).length;
  useEffect(() => {
    function handleKey(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if (event.code === 'Space' && event.target.tagName !== 'BUTTON' && question) { event.preventDefault(); onFlip(); }
      if (event.key === 'ArrowRight' && question) { event.preventDefault(); onMove(1); }
      if (event.key === 'ArrowLeft' && question) { event.preventDefault(); onMove(-1); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [question, onFlip, onMove]);
  return <div className="narrow-screen review-screen animate-slide-up"><Back onClick={onBack} /><div className="screen-intro"><span className="eyebrow"><Layers size={14} />ÔN TẬP ĐỂ NHỚ LÂU HƠN</span><h1>Một lần sai, thêm một lần hiểu.</h1><p>{subject.icon} {subject.name} · {ids.length} câu còn trong bộ ôn tập · {remaining} câu chưa học</p></div>{!question ? <div className="work-card cleared-state"><span className="trophy-icon"><Sparkles size={35} /></span><h2>Đã ôn hết câu sai! 🎉</h2><p>Bộ thẻ của bạn đã sạch. Sẵn sàng khám phá thêm kiến thức?</p><button className="button primary" onClick={onBack}>Về danh sách môn học<ChevronRight size={16} /></button></div> : <><div className="review-counter"><span>Thẻ <strong>{index + 1}</strong> / {ids.length}</span><span className="soft-badge">{ids.length} câu cần ôn</span></div><Progress value={(index + 1) / ids.length * 100} label="Vị trí trong bộ thẻ" /><button className={`flashcard ${flipped ? 'is-flipped' : ''}`} onClick={onFlip} aria-label={flipped ? 'Mặt sau. Nhấn để xem câu hỏi' : 'Mặt trước. Nhấn để xem đáp án'} aria-pressed={flipped}><span className="flashcard-inner"><span className="flashcard-face flashcard-front" aria-hidden={flipped}><span className="flashcard-top"><span>{question.topic}</span><Layers size={19} /></span><strong>{question.question}</strong><span className="flashcard-hint"><RotateCcw size={15} />Chạm để lật thẻ · phím Space</span></span><span className="flashcard-face flashcard-back" aria-hidden={!flipped}><span className="flashcard-top"><span><Check size={16} />ĐÁP ÁN ĐÚNG</span><Sparkles size={19} /></span><strong>{question.options[question.correctAnswer]}</strong><span className="flashcard-explanation">{question.explanation}</span><span className="flashcard-hint"><RotateCcw size={15} />Chạm để xem lại câu hỏi</span></span></span></button><div className="review-actions"><button className="button secondary" onClick={() => onMove(1)}><RotateCcw size={17} />Ôn lại sau</button><button className="button primary" disabled={!flipped} onClick={() => onRemember(question.id)}><Check size={18} />Mình đã nhớ!</button></div><div className="review-navigation"><button aria-label="Thẻ trước" className="icon-button" onClick={() => onMove(-1)}><ChevronLeft size={19} /></button><p>{flipped ? 'Đã nhớ? Gỡ thẻ khỏi bộ ôn tập của bạn.' : 'Lật thẻ để kiểm tra đáp án trước khi đánh dấu đã nhớ.'}</p><button aria-label="Thẻ tiếp theo" className="icon-button" onClick={() => onMove(1)}><ChevronRight size={19} /></button></div></>}</div>;
}
