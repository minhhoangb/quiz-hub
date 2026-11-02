import { ArrowLeft, ArrowRight, Check, CloudCheck, Layers, Sparkles } from 'lucide-react';

export function Back({ onClick, label = 'Quay lại môn học' }) {
  return <button className="back-link" onClick={onClick}><ArrowLeft size={16} />{label}</button>;
}

export function Progress({ value, label }) {
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function StudyArt() {
  return <div className="study-art" aria-hidden="true">
    <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
    <span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✧</span><span className="art-dot" />
    <div className="art-card art-card-back"><Layers size={32} /></div>
    <div className="art-card art-card-front"><span className="art-card-label">MỖI NGÀY MỘT CHÚT</span><div className="art-bulb"><Sparkles size={38} strokeWidth={1.6} /></div><span className="art-line" /><span className="art-line short" /><div className="art-answer"><span><Check size={13} /></span> Hiểu sâu. Nhớ lâu.</div></div>
    <span className="art-check"><Check size={23} strokeWidth={3} /></span>
  </div>;
}

export function SaveStatus() {
  return <span className="save-status"><CloudCheck size={15} />Tiến độ tự động lưu</span>;
}

export function NextLabel({ children }) { return <>{children}<ArrowRight size={17} /></>; }
