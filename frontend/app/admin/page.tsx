'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, GraduationCap, CalendarClock, Award, Plus, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthGate } from '@/components/AuthGate';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { QuestionForm } from '@/components/QuestionForm';
import { QUIZ_CATEGORY_LABELS } from '@/lib/types';
import type { AdminOverview, QuizCategory, QuizQuestionAdmin, QuizQuestionInput } from '@/lib/types';

function OverviewCards({ overview }: { overview: AdminOverview | null }) {
  const items = [
    { label: 'Studentë Aktivë', value: overview?.studenteAktive, icon: Users },
    { label: 'Instruktorë', value: overview?.instruktoreTotal, icon: GraduationCap },
    { label: 'Orë Sot', value: overview?.oreSot, icon: CalendarClock },
    { label: 'Gati për Provim', value: overview?.studenteGati, icon: Award },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="flex flex-col gap-1.5">
          <Icon size={16} className="text-brand-500" />
          <span className="text-2xl font-bold text-ink">{value ?? '—'}</span>
          <span className="text-xs text-ink-muted">{label}</span>
        </Card>
      ))}
    </div>
  );
}

function QuestionsManager() {
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuizCategory | ''>('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<QuizQuestionAdmin[]>(`/quiz/questions${filter ? `?kategoria=${filter}` : ''}`)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function createQuestion(input: QuizQuestionInput) {
    setSubmitting(true);
    try {
      const created = await api.post<QuizQuestionAdmin>('/quiz/questions', input);
      setQuestions((prev) => [created, ...prev]);
      setCreating(false);
      toast.success('Pyetja u shtua');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë shtimit');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateQuestion(id: string, input: QuizQuestionInput) {
    setSubmitting(true);
    try {
      const updated = await api.put<QuizQuestionAdmin>(`/quiz/questions/${id}`, input);
      setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setEditingId(null);
      toast.success('Pyetja u përditësua');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë përditësimit');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuestion(id: string) {
    try {
      await api.del(`/quiz/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success('Pyetja u fshi');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë fshirjes');
    } finally {
      setConfirmingDeleteId(null);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          Banka e Pyetjeve ({questions.length})
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as QuizCategory | '')}
            className="rounded-xl border border-border-subtle bg-surface-muted px-3 py-1.5 text-xs outline-none focus:border-brand-500"
          >
            <option value="">Të gjitha kategoritë</option>
            {Object.entries(QUIZ_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => { setCreating((v) => !v); setEditingId(null); }}>
            <Plus size={14} /> Pyetje e Re
          </Button>
        </div>
      </div>

      {creating && (
        <div className="mb-4">
          <QuestionForm submitting={submitting} onCancel={() => setCreating(false)} onSubmit={createQuestion} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : questions.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">S&apos;ka pyetje në këtë kategori.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {questions.map((q) => (
            <div key={q.id} className="py-3">
              {editingId === q.id ? (
                <QuestionForm
                  initial={q}
                  submitting={submitting}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) => updateQuestion(q.id, input)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-ink">{q.teksti}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{QUIZ_CATEGORY_LABELS[q.kategoria]}</Badge>
                      <Badge tone="muted">{q.veshtiresia}</Badge>
                      {!q.aktiv && <Badge tone="warn">Joaktive</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => { setEditingId(q.id); setCreating(false); }} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted" aria-label="Ndrysho">
                      <Pencil size={15} />
                    </button>
                    {confirmingDeleteId === q.id ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => deleteQuestion(q.id)}>Fshi</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmingDeleteId(null)}>Anulo</Button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmingDeleteId(q.id)} className="rounded-lg p-1.5 text-ink-muted hover:text-danger-500" aria-label="Fshi">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AdminContent() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    api.get<AdminOverview>('/reports/admin-overview').then(setOverview);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Paneli i Adminit</h1>
        <p className="text-sm text-ink-muted">Përmbledhje e autoshkollës dhe menaxhimi i pyetjeve të testit.</p>
      </div>

      <OverviewCards overview={overview} />
      <QuestionsManager />
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGate allowedRoles={['ADMIN']}>
      <AdminContent />
    </AuthGate>
  );
}
