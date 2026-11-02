import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, Check, GraduationCap, Layers, Leaf, ShieldCheck, Target } from 'lucide-react';
import subjects from './data/subjects.js';
import usePersistedState from './hooks/usePersistedState.js';
import { addWrong, initialState, removeWrong, STORAGE_KEY } from './lib/storage.js';
import { createSession, finishSession, recordAnswer, resumeSession } from './lib/session.js';
import ScreenSubjects from './components/ScreenSubjects.jsx';
import ScreenSetup from './components/ScreenSetup.jsx';
import ScreenQuiz from './components/ScreenQuiz.jsx';
import ScreenSummary from './components/ScreenSummary.jsx';
import ScreenReview from './components/ScreenReview.jsx';
import { SaveStatus } from './components/UI.jsx';

// Vite tự tìm JSON: thêm môn chỉ cần thêm file và một dòng trong registry.
const files = import.meta.glob('./data/questions/*.json', { eager: true, import: 'default' });
const banks = Object.fromEntries(subjects.map(subject => [subject.id, files[`./data/questions/${subject.file}.json`] ?? []]));

export default function App() {
  const [state, setState, storageError] = usePersistedState(STORAGE_KEY, initialState);
  const [screen, setScreen] = useState('subjects');
  const [view, setView] = useState('subjects');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const mainRef = useRef(null);
  const subject = subjects.find(item => item.id === subjectId);
  const questions = banks[subjectId] ?? [];
  const wrongCount = state.wrong[subjectId]?.length ?? 0;
  const totalWrong = subjects.reduce((total, subject) => total + (state.wrong[subject.id]?.length ?? 0), 0);
  const remaining = questions.length - (state.answeredIds[subjectId] ?? []).filter(id => questions.some(q => q.id === id)).length;
  const answeredTotal = subjects.reduce((sum, subject) => sum + (state.answeredIds[subject.id]?.length ?? 0), 0);
  const navItems = [{ id: 'subjects', label: 'Môn học', icon: BookOpen }, { id: 'review', label: 'Ôn tập câu sai', icon: Layers }, { id: 'stats', label: 'Kết quả học tập', icon: ChartNoAxesCombined }];

  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [screen, view, subjectId]);
  function goHome(nextView = 'subjects') { setView(nextView); setScreen('subjects'); }
  function setup(id) { setSubjectId(id); setScreen('setup'); }
  function review(id) { setSubjectId(id); setView('review'); setScreen('review'); }
  function resume() {
    const active = resumeSession(state.session?.subjectId, state);
    if (active) { setSubjectId(active.subjectId); setView('subjects'); setScreen('quiz'); }
  }
  function start(mode, count) {
    const session = createSession(subjectId, mode, count, questions.map(q => q.id), state.answeredIds[subjectId] ?? []);
    setState(previous => ({ ...previous, session }));
    setView('subjects'); setScreen('quiz');
  }
  function answer(question, chosen) {
    setState(previous => {
      const session = recordAnswer(previous.session, question.id, chosen, chosen === question.correctAnswer);
      if (session === previous.session) return previous;
      let next = { ...previous, session, answeredIds: { ...previous.answeredIds, [subjectId]: [...new Set([...(previous.answeredIds[subjectId] ?? []), question.id])] } };
      if (chosen !== question.correctAnswer) next = addWrong(subjectId, question.id, next);
      return next;
    });
  }
  function nextQuestion() {
    const current = state.session;
    if (!current.answers.some(answer => answer.questionId === current.questionIds[current.currentIndex])) return;
    if (current.currentIndex === current.totalPlanned - 1) {
      setState(previous => ({ ...previous, ...finishSession(previous.session, previous.stats) }));
      setScreen('summary');
    } else setState(previous => ({ ...previous, session: { ...previous.session, currentIndex: previous.session.currentIndex + 1 } }));
  }
  function flip() { setState(previous => ({ ...previous, reviewFlipped: { ...previous.reviewFlipped, [subjectId]: !previous.reviewFlipped[subjectId] } })); }
  function moveCard(direction) {
    setState(previous => {
      const length = (previous.wrong[subjectId] ?? []).filter(id => questions.some(q => q.id === id)).length;
      const index = previous.reviewIndex[subjectId] ?? 0;
      return { ...previous, reviewIndex: { ...previous.reviewIndex, [subjectId]: length ? (index + direction + length) % length : 0 }, reviewFlipped: { ...previous.reviewFlipped, [subjectId]: false } };
    });
  }
  function remember(id) {
    setState(previous => {
      const next = removeWrong(subjectId, id, previous);
      const length = next.wrong[subjectId].filter(id => questions.some(q => q.id === id)).length;
      // Sau khi xóa, thẻ kế tiếp dồn vào chính vị trí hiện tại; cuối bộ quay về đầu.
      return { ...next, reviewIndex: { ...next.reviewIndex, [subjectId]: length ? (previous.reviewIndex[subjectId] ?? 0) % length : 0 }, reviewFlipped: { ...next.reviewFlipped, [subjectId]: false } };
    });
  }

  return <div className="app-shell"><a href="#main-content" className="skip-link">Đến nội dung chính</a><aside className="sidebar"><button className="brand" onClick={() => goHome()} aria-label="Quiz Hub — về trang môn học"><span className="brand-mark">Q<span /></span><span>Quiz Hub<span className="brand-dot">.</span></span></button><div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div><nav aria-label="Điều hướng chính">{navItems.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => goHome(item.id)}><item.icon size={19} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'review' && totalWrong > 0 && <span className="nav-count">{totalWrong}</span>}{view === item.id && item.id !== 'review' && <span className="nav-active-dot" />}</button>)}</nav><div className="sidebar-goal"><span className="goal-icon"><Leaf size={23} /></span><h3>Tích tiểu thành đại.</h3><p>Mỗi câu hỏi là một bước gần hơn đến mục tiêu.</p><div className="goal-progress"><span>{Math.min(answeredTotal, 5)}/5 câu đầu tiên</span>{answeredTotal >= 5 ? <Check size={14} /> : <Target size={14} />}</div><div className="progress-track"><div style={{ width: `${Math.min(answeredTotal / 5 * 100, 100)}%` }} /></div><button className="goal-link" onClick={() => goHome('stats')}>Xem hành trình của bạn<ArrowUpRight size={14} /></button></div><div className="sidebar-bottom"><span className="local-icon"><ShieldCheck size={19} /></span><div><strong>Góc học tập cá nhân</strong><span>Dữ liệu lưu trên thiết bị này</span></div><span className="online-dot" /></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumb"><GraduationCap size={18} /><span>Góc học tập</span><span className="breadcrumb-slash">/</span><strong>{screen === 'subjects' ? navItems.find(item => item.id === view)?.label : subject?.name}</strong></div><SaveStatus /></header><main id="main-content" ref={mainRef} tabIndex={-1}>{storageError && <div className="storage-error" role="alert">Không thể lưu vào trình duyệt. Hãy cho phép lưu trữ hoặc giải phóng dung lượng trước khi đóng trang.</div>}{screen === 'subjects' && <ScreenSubjects subjects={subjects} banks={banks} state={state} view={view} onSetup={setup} onResume={resume} onReview={review} />}{screen === 'setup' && subject && <ScreenSetup key={subjectId} subject={subject} questions={questions} state={state} onBack={() => goHome()} onStart={start} />}{screen === 'quiz' && subject && state.session && <ScreenQuiz subject={subject} questions={questions} session={state.session} wrongCount={wrongCount} remaining={remaining} onBack={() => goHome()} onAnswer={answer} onNext={nextQuestion} />}{screen === 'summary' && subject && state.session && <ScreenSummary subject={subject} questions={questions} session={state.session} wrongCount={wrongCount} remaining={remaining} onBack={() => goHome()} onReview={() => review(subjectId)} onNew={() => setup(subjectId)} />}{screen === 'review' && subject && <ScreenReview subject={subject} questions={questions} state={state} onBack={() => goHome('review')} onFlip={flip} onMove={moveCard} onRemember={remember} />}</main><footer className="page-footer"><span>Học từng chút. Tiến xa hơn.</span><span>Được tạo cho sự tò mò của bạn <span aria-hidden="true">✦</span></span></footer></div></div>;
}
