import MathText from './MathText.jsx';
import { mathTextLabel } from '../lib/mathText.js';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileJson, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { Back } from './UI.jsx';
import { editedFilename, validateQuestions } from '../lib/questionBank.js';

const levels = { Easy: 'Cơ bản', Medium: 'Trung bình', Hard: 'Nâng cao' };
const PAGE_SIZE = 10;

export default function ScreenQuestions({ subject, questions, originalQuestions, hasEdited, useEdited, onSource, onUpdate, onBack, onDirtyChange }) {
  const [draft, setDraft] = useState(() => structuredClone(questions));
  const [editing, setEditing] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const formRef = useRef(null);
  const hasChanges = dirty || Boolean(editing);
  useEffect(() => { onDirtyChange(hasChanges); }, [hasChanges, onDirtyChange]);
  useEffect(() => {
    const preventClose = event => { if (hasChanges) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [hasChanges]);
  useEffect(() => { if (editing) formRef.current?.querySelector('textarea')?.focus(); }, [editing?.id]);

  function leave(action) {
    if (!hasChanges || window.confirm('Bạn có thay đổi chưa cập nhật. Bỏ thay đổi và tiếp tục?')) action();
  }
  function edit(question) { setEditing(structuredClone(question)); setError(''); setStatus(''); }
  function add() {
    const id = Math.max(0, ...questions.map(q => q.id), ...draft.map(q => q.id)) + 1;
    edit({ id, topic: '', difficulty: 'Easy', question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });
  }
  function applyEdit(event) {
    event.preventDefault();
    const message = validateQuestions([editing]);
    if (message) { setError(message); return; }
    setDraft(previous => previous.some(q => q.id === editing.id) ? previous.map(q => q.id === editing.id ? editing : q) : [...previous, editing]);
    setEditing(null); setDirty(true); setError(''); setStatus('');
  }
  function remove(id) {
    setDraft(previous => previous.filter(q => q.id !== id));
    setDirty(true); setStatus(''); setError('');
  }
  function update() {
    const message = validateQuestions(draft);
    if (message) { setError(message); return; }
    try {
      const persisted = onUpdate(draft);
      setDirty(false); setError('');
      setStatus(persisted ? `Đã cập nhật và tải ${editedFilename(subject.file)}. Bản đã sửa đang được dùng.` : `Đã tải ${editedFilename(subject.file)} và áp dụng bản sửa cho lần mở này. Không thể lưu vào trình duyệt; hãy giữ file vừa tải.`);
    } catch { setError('Chưa thể xuất file. Thay đổi vẫn được giữ ở đây, hãy thử cập nhật lại.'); }
  }
  const filtered = draft.filter(q => {
    const content = `${q.id} ${q.topic} ${q.question} ${q.options.join(' ')} ${q.explanation}`;
    return `${content} ${mathTextLabel(content)}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'));
  });
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return <div className="question-bank-screen animate-fade-in">
    <Back onClick={onBack} />
    <div className="screen-intro"><span className="eyebrow"><FileJson size={14} />NGÂN HÀNG CÂU HỎI</span><h1>{subject.name} · Câu hỏi & đáp án</h1><p>Xem đáp án, sửa nội dung theo cách bạn muốn rồi cập nhật để giữ bản riêng.</p></div>
    <div className="bank-toolbar work-card">
      {hasEdited ? <label className="bank-source">Bộ câu hỏi đang dùng<select value={useEdited ? 'edited' : 'original'} disabled={Boolean(editing)} onChange={event => leave(() => { onSource(event.target.value === 'edited'); setDraft(structuredClone(event.target.value === 'edited' ? hasEdited.questions : originalQuestions)); setDirty(false); setStatus(''); setError(''); setPage(0); })}><option value="original">JSON có sẵn</option><option value="edited">JSON đã chỉnh sửa</option></select></label> : <span className="soft-badge">JSON có sẵn · {draft.length} câu</span>}
      <div className="bank-toolbar-actions"><button className="button secondary" onClick={add} disabled={Boolean(editing)}><Plus size={16} />Thêm câu hỏi</button><button className="button primary" onClick={update} disabled={!dirty || Boolean(editing)}><Save size={16} />Cập nhật</button></div>
      <p className="bank-help">Cập nhật sẽ tải {editedFilename(subject.file)} và lưu bản riêng trên trình duyệt này.</p>
    </div>
    {status && <p className="bank-status" role="status">{status}</p>}
    {error && <p className="storage-error" role="alert">{error}</p>}
    {editing && <form className="work-card bank-editor" ref={formRef} onSubmit={applyEdit}>
      <h2>{draft.some(q => q.id === editing.id) ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'} #{editing.id}</h2>
      <label>Nội dung câu hỏi<textarea required rows={3} value={editing.question} onChange={event => setEditing({ ...editing, question: event.target.value })} /></label>
      <div className="bank-field-row"><label>Chủ đề<input required value={editing.topic} onChange={event => setEditing({ ...editing, topic: event.target.value })} /></label><label>Mức độ<select value={editing.difficulty} onChange={event => setEditing({ ...editing, difficulty: event.target.value })}>{Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <fieldset><legend>Các đáp án · chọn một đáp án đúng</legend>{editing.options.map((option, index) => <div className="bank-option-edit" key={index}><label className="bank-correct-choice"><input type="radio" name="correct-answer" checked={editing.correctAnswer === index} onChange={() => setEditing({ ...editing, correctAnswer: index })} aria-label={`Chọn ${String.fromCharCode(65 + index)} làm đáp án đúng`} /><span>{String.fromCharCode(65 + index)}</span></label><textarea rows={2} required aria-label={`Nội dung đáp án ${String.fromCharCode(65 + index)}`} value={option} onChange={event => setEditing({ ...editing, options: editing.options.map((value, i) => i === index ? event.target.value : value) })} /></div>)}</fieldset>
      <label>Giải thích đáp án<textarea required rows={3} value={editing.explanation} onChange={event => setEditing({ ...editing, explanation: event.target.value })} /></label>
      <div className="bank-toolbar-actions"><button type="submit" className="button primary"><Check size={16} />Lưu vào bản nháp</button><button type="button" className="button secondary" onClick={() => { setEditing(null); setError(''); }}>Hủy chỉnh sửa</button></div>
    </form>}
    <label className="bank-search"><Search size={18} /><span className="sr-only">Tìm câu hỏi hoặc đáp án</span><input type="search" placeholder="Tìm câu hỏi, chủ đề hoặc đáp án…" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
    <div className="bank-list-heading"><span>{filtered.length} câu hỏi{dirty ? ' · Có thay đổi chưa cập nhật' : ''}</span><span>{useEdited ? 'Bản đã chỉnh sửa' : 'Bản có sẵn'}</span></div>
    {!shown.length && <div className="work-card cleared-state"><h2>{draft.length ? 'Không tìm thấy câu hỏi' : 'Chưa có câu hỏi'}</h2><p>{draft.length ? 'Thử tìm bằng từ khóa khác.' : 'Thêm câu hỏi để bắt đầu xây dựng bộ câu hỏi của bạn.'}</p></div>}
    <div className="bank-list">{shown.map(question => <article className="work-card bank-question" key={question.id}>
      <div className="bank-question-heading"><button className="card-delete" onClick={() => remove(question.id)} disabled={Boolean(editing)} aria-label="Xóa" title="Xóa"><Trash2 size={17} aria-hidden="true" /></button><span className="soft-badge">#{question.id} · {question.topic}</span><span className={`difficulty difficulty-${question.difficulty}`}>{levels[question.difficulty]}</span></div>
      <h2><MathText>{question.question}</MathText></h2>
      <ol className="bank-answers" type="A">{question.options.map((option, index) => <li key={index} className={index === question.correctAnswer ? 'is-correct' : ''}><span><MathText>{option}</MathText></span>{index === question.correctAnswer && <span className="bank-answer-label"><Check size={14} />Đáp án đúng</span>}</li>)}</ol>
      <div className="bank-explanation"><strong>Giải thích</strong><p><MathText>{question.explanation}</MathText></p></div>
      <div className="bank-question-actions"><button className="button secondary" onClick={() => edit(question)} disabled={Boolean(editing)} aria-label={`Chỉnh sửa câu hỏi ${question.id}`}><Pencil size={15} />Chỉnh sửa</button></div>
    </article>)}</div>
    {filtered.length > PAGE_SIZE && <nav className="bank-pagination" aria-label="Phân trang câu hỏi"><button className="button secondary" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} />Trang trước</button><span>{currentPage + 1} / {lastPage + 1}</span><button className="button secondary" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Trang sau<ChevronRight size={16} /></button></nav>}
  </div>;
}
