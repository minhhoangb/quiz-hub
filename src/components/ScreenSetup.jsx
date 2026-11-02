import { useState } from 'react';
import { ArrowRight, Check, Clock3, Infinity as InfinityIcon, Layers, ListChecks } from 'lucide-react';
import { Back, Progress } from './UI.jsx';
import { questionsForDifficulty } from '../lib/questionBank.js';

const difficulties = { Easy: 'Cơ bản', Medium: 'Trung bình', Hard: 'Nâng cao' };

export default function ScreenSetup({ subject, questions, state, onBack, onStart }) {
  const [mode, setMode] = useState('count');
  const [difficulty, setDifficulty] = useState(() => Object.keys(difficulties).find(level => questions.some(q => q.difficulty === level)) ?? 'Easy');
  const filteredQuestions = mode === 'all' ? questions : questionsForDifficulty(questions, difficulty);
  const [count, setCount] = useState(Math.min(5, filteredQuestions.length));
  const [custom, setCustom] = useState(false);
  const [replace, setReplace] = useState(false);
  const total = filteredQuestions.length;
  const learned = (state.answeredIds[subject.id] ?? []).filter(id => filteredQuestions.some(q => q.id === id)).length;
  const wrong = (state.wrong[subject.id] ?? []).filter(id => filteredQuestions.some(q => q.id === id)).length;
  const remaining = total - learned;
  const valid = Number.isInteger(Number(count)) && Number(count) >= 1 && Number(count) <= total && count !== '';
  const active = state.session?.status === 'active';
  const progressLabel = mode === 'count' ? `Tiến độ mức ${difficulties[difficulty]}` : 'Tiến độ môn học';
  function submit(event) {
    event.preventDefault();
    if (!total || (mode === 'count' && !valid)) return;
    if (active && !replace) { setReplace(true); return; }
    onStart(mode, Number(count), mode === 'count' ? difficulty : null);
  }
  function changeDifficulty(level) {
    const available = questionsForDifficulty(questions, level).length;
    setDifficulty(level);
    setCount(previous => Math.min(Number.isInteger(Number(previous)) && Number(previous) > 0 ? Number(previous) : 5, available));
    setReplace(false);
  }
  const difficultySelector = <fieldset className="difficulty-options">
    <legend className="field-label">Chọn mức độ</legend>
    <div className="difficulty-choices">{Object.entries(difficulties).map(([level, label]) => {
      const available = questionsForDifficulty(questions, level).length;
      return <label key={level} className={`preset difficulty-choice ${difficulty === level ? 'selected' : ''} ${!available ? 'is-disabled' : ''}`}>
        <input className="sr-only" type="radio" name="difficulty" value={level} checked={difficulty === level} disabled={!available} onChange={() => changeDifficulty(level)} />
        <strong>{label}</strong><span>{available} câu hỏi</span>
      </label>;
    })}</div>
  </fieldset>;
  return <div className="narrow-screen animate-slide-up"><Back onClick={onBack} /><div className="screen-intro"><span className="eyebrow">THIẾT KẾ PHIÊN HỌC</span><h1>Hôm nay, học vừa sức thôi.</h1><p>{subject.icon} {subject.name} <span className="dot-separator">·</span> {questions.length} câu hỏi trong ngân hàng</p></div><form className="work-card" onSubmit={submit}><div className="work-card-heading"><h2>Chọn nhịp học của bạn</h2><span className="soft-badge"><Layers size={14} />{wrong} câu cần ôn</span></div><fieldset className="mode-options"><legend className="sr-only">Chế độ học</legend><label className={`mode-option ${mode === 'count' ? 'selected' : ''}`}><input type="radio" name="mode" value="count" checked={mode === 'count'} onChange={() => { setMode('count'); setReplace(false); }} /><ListChecks size={24} /><strong>Học theo số câu</strong><span>Một mục tiêu nhỏ, dễ bắt đầu.</span><i>{mode === 'count' && <Check size={12} />}</i></label><label className={`mode-option ${mode === 'all' ? 'selected' : ''}`}><input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={() => { setMode('all'); setReplace(false); }} /><InfinityIcon size={24} /><strong>Học tất cả</strong><span>Khám phá trọn bộ {questions.length} câu hỏi.</span><i>{mode === 'all' && <Check size={12} />}</i></label></fieldset>{mode === 'count' ? <div className="count-section">{difficultySelector}<label className="field-label" htmlFor="question-count">Bạn muốn luyện bao nhiêu câu?</label><div className="preset-row">{[5, 10, 20].map(n => <button className={`preset ${!custom && Number(count) === n ? 'selected' : ''}`} disabled={n > total} type="button" onClick={() => { setCount(n); setCustom(false); setReplace(false); }} key={n}>{n} câu</button>)}<button className={`preset ${custom ? 'selected' : ''}`} type="button" onClick={() => setCustom(true)}>Tùy chọn</button></div><div className="count-input-row"><input id="question-count" type="number" min="1" max={total} step="1" value={count} aria-invalid={!valid} aria-describedby="count-help" onChange={event => { setCount(event.target.value); setCustom(true); setReplace(false); }} /><span>/ {total} câu hỏi</span></div><p id="count-help" className={!valid ? 'field-error' : 'field-help'}>{valid ? `Chọn từ 1 đến ${total} câu hỏi. Các câu chưa học được ưu tiên.` : `Vui lòng nhập số nguyên từ 1 đến ${total}.`}</p>{valid && Number(count) > remaining && <p className="info-note">Còn {remaining} câu chưa học. Phiên này sẽ bổ sung câu đã học để đủ {count} câu, không lặp trong cùng phiên.</p>}</div> : <div className="all-description"><InfinityIcon size={30} /><div><strong>Toàn bộ {total} câu hỏi. Không bỏ sót.</strong><p>Bạn sẽ trả lời tất cả {total} câu hỏi trong môn này; không giới hạn thời gian.</p>{total > 30 && <p className="info-note">Phiên học dài — bạn có thể tạm dừng bất cứ lúc nào. Quiz Hub sẽ nhớ tiến độ.</p>}</div></div>}<div className="setup-progress"><div><span>{progressLabel}</span><strong>{learned}/{total} câu đã khám phá</strong></div><Progress value={total ? learned / total * 100 : 0} label={progressLabel} /><span>{remaining} câu chưa học</span></div>{replace && <div className="replace-warning" role="alert"><strong>Bắt đầu phiên mới?</strong><p>Phiên đang học sẽ được thay thế. Câu đã trả lời và thẻ ôn tập vẫn được giữ.</p><button type="button" className="text-button" onClick={() => setReplace(false)}>Giữ phiên hiện tại</button></div>}<button className="button primary start-button" disabled={!total || (mode === 'count' && !valid)} type="submit">{replace ? 'Xác nhận bắt đầu phiên mới' : `Bắt đầu ${mode === 'all' ? total : valid ? count : '…'} câu hỏi`}<ArrowRight size={17} /></button><div className="center-help"><Clock3 size={14} />Không bấm giờ. Tạm dừng bất cứ lúc nào.</div></form></div>;
}
