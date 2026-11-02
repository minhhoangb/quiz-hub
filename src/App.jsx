import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, Check, GraduationCap, Layers, Leaf, ShieldCheck, Target } from 'lucide-react';
import allSubjects from './data/subjects.js';
import { CARD_VISIBILITY_KEY } from './data/cardVisibility.js';
import { downloadQuestions, EDITED_BANKS_KEY, getEditedBank, questionsForDifficulty, validateQuestions } from './lib/questionBank.js';
import usePersistedState from './hooks/usePersistedState.js';
import { addWrong, initialState, removeWrong, STORAGE_KEY } from './lib/storage.js';
import { createSession, finishSession, recordAnswer, resumeSession } from './lib/session.js';
import ScreenSubjects from './components/ScreenSubjects.jsx';
import ScreenSetup from './components/ScreenSetup.jsx';
import ScreenQuiz from './components/ScreenQuiz.jsx';
import ScreenSummary from './components/ScreenSummary.jsx';
import ScreenReview from './components/ScreenReview.jsx';
import ScreenQuestions from './components/ScreenQuestions.jsx';
import { SaveStatus } from './components/UI.jsx';

// Vite tự tìm JSON: thêm môn chỉ cần thêm file và một dòng trong registry.
const files = import.meta.glob('./data/questions/*.json', { eager: true, import: 'default' });
const originalBanks = Object.fromEntries(allSubjects.map(subject => [subject.id, files[`./data/questions/${subject.file}.json`] ?? []]));

export default function App() {
  const [savedState, setState, storageError] = usePersistedState(STORAGE_KEY, initialState);
  const [hiddenCards, setHiddenCards, visibilityError] = usePersistedState(CARD_VISIBILITY_KEY, {});
  const [editedBanks, setEditedBanks, editedError] = usePersistedState(EDITED_BANKS_KEY, {});
  const banks = Object.fromEntries(allSubjects.map(subject => {
    const edited = getEditedBank(editedBanks, subject.id);
    return [subject.id, edited?.useEdited ? edited.questions : originalBanks[subject.id]];
  }));
  const subjects = allSubjects.filter(subject => hiddenCards?.[`subject:${subject.id}`] !== true);
  const state = { ...savedState, wrong: Object.fromEntries(allSubjects.map(subject => [subject.id, (savedState.wrong[subject.id] ?? []).filter(id => hiddenCards?.[`review:${subject.id}:${id}`] !== true && banks[subject.id].some(q => q.id === id))])) };
  const [screen, setScreen] = useState('subjects');
  const [view, setView] = useState('subjects');
  const [editorDirty, setEditorDirty] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const mainRef = useRef(null);
  const subject = subjects.find(item => item.id === subjectId);
  const editedBank = getEditedBank(editedBanks, subjectId);
  const snapshot = ['quiz', 'summary'].includes(screen) && state.session?.questionsSnapshot;
  const questions = snapshot && !validateQuestions(snapshot) ? snapshot : banks[subjectId] ?? [];
  const wrongCount = (state.wrong[subjectId] ?? []).filter(id => questions.some(q => q.id === id)).length;
  const totalWrong = subjects.reduce((total, subject) => total + (state.wrong[subject.id]?.length ?? 0), 0);
  const remaining = questions.length - (state.answeredIds[subjectId] ?? []).filter(id => questions.some(q => q.id === id)).length;
  const answeredTotal = subjects.reduce((sum, subject) => sum + (state.answeredIds[subject.id] ?? []).filter(id => banks[subject.id].some(q => q.id === id)).length, 0);
  const navItems = [{ id: 'subjects', label: 'Môn học', icon: BookOpen }, { id: 'review', label: 'Ôn tập câu sai', icon: Layers }, { id: 'stats', label: 'Kết quả học tập', icon: ChartNoAxesCombined }];

  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [screen, view, subjectId]);
  function goHome(nextView = 'subjects') {
    if (screen === 'questions' && editorDirty && !window.confirm('Bạn có thay đổi chưa cập nhật. Bỏ thay đổi và tiếp tục?')) return;
    setEditorDirty(false); setView(nextView); setScreen('subjects');
  }
  function setup(id) { setSubjectId(id); setScreen('setup'); }
  function showQuestions(id) { setSubjectId(id); setView('subjects'); setScreen('questions'); }
  function preserveSession() {
    if (savedState.session?.subjectId === subjectId && !savedState.session.questionsSnapshot) {
      setState(previous => ({ ...previous, session: { ...previous.session, questionsSnapshot: banks[subjectId] } }));
    }
  }
  function selectSource(useEdited) {
    preserveSession();
    setEditedBanks(previous => ({ ...previous, [subjectId]: { ...editedBank, useEdited } }));
  }
  function updateQuestions(nextQuestions) {
    downloadQuestions(subject.file, nextQuestions);
    preserveSession();
    const next = { ...editedBanks, [subjectId]: { questions: nextQuestions, useEdited: true } };
    setEditedBanks(next);
    try { return window.localStorage.getItem(EDITED_BANKS_KEY) === JSON.stringify(next); }
    catch { return false; }
  }
  function review(id) { setSubjectId(id); setView('review'); setScreen('review'); }
  function hideSubject(id) {
    setHiddenCards(previous => ({ ...previous, [`subject:${id}`]: true }));
    mainRef.current?.focus({ preventScroll: true });
  }
  function hideReviewCard(id) {
    setHiddenCards(previous => ({ ...previous, [`review:${subjectId}:${id}`]: true }));
    setState(previous => ({ ...previous, reviewFlipped: { ...previous.reviewFlipped, [subjectId]: false } }));
    mainRef.current?.focus({ preventScroll: true });
  }
  function resume() {
    const active = resumeSession(state.session?.subjectId, state);
    if (active) { setSubjectId(active.subjectId); setView('subjects'); setScreen('quiz'); }
  }
  function start(mode, count, difficulty) {
    const selectedQuestions = mode === 'all' ? questions : questionsForDifficulty(questions, difficulty);
    const session = createSession(subjectId, mode, count, selectedQuestions.map(q => q.id), state.answeredIds[subjectId] ?? []);
    setState(previous => ({ ...previous, session: { ...session, difficulty, questionsSnapshot: selectedQuestions } }));
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
      const length = (state.wrong[subjectId] ?? []).filter(id => questions.some(q => q.id === id)).length;
      const index = previous.reviewIndex[subjectId] ?? 0;
      return { ...previous, reviewIndex: { ...previous.reviewIndex, [subjectId]: length ? (index + direction + length) % length : 0 }, reviewFlipped: { ...previous.reviewFlipped, [subjectId]: false } };
    });
  }
  function remember(id) {
    setState(previous => {
      const next = removeWrong(subjectId, id, previous);
      const length = next.wrong[subjectId].filter(id => questions.some(q => q.id === id) && hiddenCards?.[`review:${subjectId}:${id}`] !== true).length;
      // Sau khi xóa, thẻ kế tiếp dồn vào chính vị trí hiện tại; cuối bộ quay về đầu.
      return { ...next, reviewIndex: { ...next.reviewIndex, [subjectId]: length ? (previous.reviewIndex[subjectId] ?? 0) % length : 0 }, reviewFlipped: { ...next.reviewFlipped, [subjectId]: false } };
    });
  }

  return <div className="app-shell"><a href="#main-content" className="skip-link">Đến nội dung chính</a><aside className="sidebar"><button className="brand" onClick={() => goHome()} aria-label="Quiz Hub — về trang môn học"><span className="brand-mark">Q<span /></span><span>Quiz Hub<span className="brand-dot">.</span></span></button><div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div><nav aria-label="Điều hướng chính">{navItems.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => goHome(item.id)}><item.icon size={19} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'review' && totalWrong > 0 && <span className="nav-count">{totalWrong}</span>}{view === item.id && item.id !== 'review' && <span className="nav-active-dot" />}</button>)}</nav><div className="sidebar-goal"><span className="goal-icon"><Leaf size={23} /></span><h3>Tích tiểu thành đại.</h3><p>Mỗi câu hỏi là một bước gần hơn đến mục tiêu.</p><div className="goal-progress"><span>{Math.min(answeredTotal, 5)}/5 câu đầu tiên</span>{answeredTotal >= 5 ? <Check size={14} /> : <Target size={14} />}</div><div className="progress-track"><div style={{ width: `${Math.min(answeredTotal / 5 * 100, 100)}%` }} /></div><button className="goal-link" onClick={() => goHome('stats')}>Xem hành trình của bạn<ArrowUpRight size={14} /></button></div><div className="sidebar-bottom"><span className="local-icon"><ShieldCheck size={19} /></span><div><strong>Góc học tập cá nhân</strong><span>Dữ liệu lưu trên thiết bị này</span></div><span className="online-dot" /></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumb"><GraduationCap size={18} /><span>Góc học tập</span><span className="breadcrumb-slash">/</span><strong>{screen === 'subjects' ? navItems.find(item => item.id === view)?.label : subject?.name}</strong></div><SaveStatus /></header><main id="main-content" ref={mainRef} tabIndex={-1}>{(storageError || visibilityError || editedError) && <div className="storage-error" role="alert">Không thể lưu vào trình duyệt. Hãy cho phép lưu trữ hoặc giải phóng dung lượng trước khi đóng trang.</div>}{screen === 'subjects' && <ScreenSubjects subjects={subjects} banks={banks} state={state} view={view} onSetup={setup} onResume={resume} onReview={review} onHide={hideSubject} onQuestions={showQuestions} />}{screen === 'questions' && subject && <ScreenQuestions key={subjectId} subject={subject} questions={questions} originalQuestions={originalBanks[subjectId]} hasEdited={editedBank} useEdited={Boolean(editedBank?.useEdited)} onSource={selectSource} onUpdate={updateQuestions} onBack={() => goHome()} onDirtyChange={setEditorDirty} />}{screen === 'setup' && subject && <ScreenSetup key={subjectId} subject={subject} questions={questions} state={state} onBack={() => goHome()} onStart={start} />}{screen === 'quiz' && subject && state.session && <ScreenQuiz subject={subject} questions={questions} session={state.session} wrongCount={wrongCount} remaining={remaining} onBack={() => goHome()} onAnswer={answer} onNext={nextQuestion} />}{screen === 'summary' && subject && state.session && <ScreenSummary subject={subject} questions={questions} session={state.session} wrongCount={wrongCount} remaining={remaining} onBack={() => goHome()} onReview={() => review(subjectId)} onNew={() => setup(subjectId)} />}{screen === 'review' && subject && <ScreenReview subject={subject} questions={questions} state={state} onBack={() => goHome('review')} onFlip={flip} onMove={moveCard} onRemember={remember} onHide={hideReviewCard} />}</main><footer className="page-footer"><span>Học từng chút. Tiến xa hơn.</span><span>Được tạo cho sự tò mò của bạn <span aria-hidden="true">✦</span></span></footer></div></div>;
}
