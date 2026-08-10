'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui';
import { QUIZ_CATEGORY_LABELS } from '@/lib/types';
import type { QuizCategory, QuizQuestionAdmin, QuizQuestionInput } from '@/lib/types';

const DIFFICULTIES: { value: QuizQuestionInput['veshtiresia']; label: string }[] = [
  { value: 'LEHTE', label: 'Lehtë' },
  { value: 'MESATARE', label: 'Mesatare' },
  { value: 'VESHTIRE', label: 'Vështirë' },
];

function emptyAnswers() {
  return [
    { teksti: '', eSakte: true },
    { teksti: '', eSakte: false },
  ];
}

export function QuestionForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: QuizQuestionAdmin;
  onSubmit: (input: QuizQuestionInput) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [teksti, setTeksti] = useState(initial?.teksti || '');
  const [kategoria, setKategoria] = useState<QuizCategory>(initial?.kategoria || 'SHENJA_RRUGORE');
  const [veshtiresia, setVeshtiresia] = useState<QuizQuestionInput['veshtiresia']>(initial?.veshtiresia || 'MESATARE');
  const [aktiv, setAktiv] = useState(initial?.aktiv ?? true);
  const [answers, setAnswers] = useState(
    initial ? initial.answers.map((a) => ({ teksti: a.teksti, eSakte: a.eSakte })) : emptyAnswers()
  );

  function updateAnswer(i: number, teksti: string) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? { ...a, teksti } : a)));
  }

  function setCorrect(i: number) {
    setAnswers((prev) => prev.map((a, idx) => ({ ...a, eSakte: idx === i })));
  }

  function addAnswer() {
    setAnswers((prev) => [...prev, { teksti: '', eSakte: false }]);
  }

  function removeAnswer(i: number) {
    setAnswers((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (!next.some((a) => a.eSakte) && next.length) next[0] = { ...next[0], eSakte: true };
      return next;
    });
  }

  const valid =
    teksti.trim().length >= 3 &&
    answers.length >= 2 &&
    answers.every((a) => a.teksti.trim().length > 0) &&
    answers.filter((a) => a.eSakte).length === 1;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-muted p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">Teksti i pyetjes</label>
        <textarea
          value={teksti}
          onChange={(e) => setTeksti(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Kategoria</label>
          <select
            value={kategoria}
            onChange={(e) => setKategoria(e.target.value as QuizCategory)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(QUIZ_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Vështirësia</label>
          <select
            value={veshtiresia}
            onChange={(e) => setVeshtiresia(e.target.value as QuizQuestionInput['veshtiresia'])}
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
          <input type="checkbox" checked={aktiv} onChange={(e) => setAktiv(e.target.checked)} />
          Aktive
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">Përgjigjet (zgjidh të saktën)</label>
        <div className="flex flex-col gap-2">
          {answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-answer"
                checked={a.eSakte}
                onChange={() => setCorrect(i)}
                className="shrink-0"
              />
              <input
                value={a.teksti}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder={`Përgjigja ${i + 1}`}
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              {answers.length > 2 && (
                <button onClick={() => removeAnswer(i)} className="shrink-0 text-ink-muted hover:text-danger-500" aria-label="Hiq">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2" onClick={addAnswer}>
          <Plus size={14} /> Shto Përgjigje
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!valid || submitting}
          onClick={() => onSubmit({ teksti: teksti.trim(), kategoria, veshtiresia, aktiv, answers })}
        >
          {submitting ? 'Duke ruajtur...' : 'Ruaj'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Anulo</Button>
      </div>
    </div>
  );
}
