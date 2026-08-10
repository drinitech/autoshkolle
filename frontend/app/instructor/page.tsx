'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, CalendarPlus, CheckCircle2, Trash2, UserX } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { AuthGate } from '@/components/AuthGate';
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { formatDateLong } from '@/lib/format';
import type { AvailabilitySlot, DrivingLesson, SkillCategory, SkillLevel } from '@/lib/types';

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'E_DOBET', label: 'E dobët' },
  { value: 'MESATARE', label: 'Mesatare' },
  { value: 'MIRE', label: 'Mirë' },
];

function EvaluationForm({
  skills,
  onSubmit,
  onCancel,
  submitting,
}: {
  skills: SkillCategory[];
  onSubmit: (shenimTekst: string, ratings: { skillCategoryId: string; vleresimi: SkillLevel }[]) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [shenimTekst, setShenimTekst] = useState('');
  const [ratings, setRatings] = useState<Record<string, SkillLevel>>({});

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-muted p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {skills.map((skill) => (
          <div key={skill.id}>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">{skill.emri}</label>
            <select
              value={ratings[skill.id] || ''}
              onChange={(e) => setRatings((r) => ({ ...r, [skill.id]: e.target.value as SkillLevel }))}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Pa vlerësim —</option>
              {SKILL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">Shënime</label>
        <textarea
          value={shenimTekst}
          onChange={(e) => setShenimTekst(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          placeholder="Progres, çka duhet përmirësuar..."
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={submitting}
          onClick={() =>
            onSubmit(
              shenimTekst,
              Object.entries(ratings).map(([skillCategoryId, vleresimi]) => ({ skillCategoryId, vleresimi }))
            )
          }
        >
          {submitting ? 'Duke ruajtur...' : 'Ruaj Vlerësimin'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Anulo</Button>
      </div>
    </div>
  );
}

function InstructorContent() {
  const { user } = useAuthStore();
  const instructorId = user?.instructorId;

  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newSlot, setNewSlot] = useState({ data: '', oraFillimit: '', oraMbarimit: '' });
  const [addingSlot, setAddingSlot] = useState(false);

  function loadAll() {
    if (!instructorId) return;
    setLoading(true);
    Promise.all([
      api.get<DrivingLesson[]>(`/instructors/${instructorId}/schedule`),
      api.get<AvailabilitySlot[]>(`/instructors/${instructorId}/availability`),
      api.get<SkillCategory[]>('/skills'),
    ])
      .then(([l, s, sk]) => {
        setLessons(l);
        setSlots(s);
        setSkills(sk);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, [instructorId]);

  async function markMungese(lessonId: string) {
    try {
      await api.put(`/lessons/${lessonId}`, { statusi: 'MUNGESE' });
      toast.success('U shënua mungesë');
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim');
    }
  }

  async function submitEvaluation(
    lessonId: string,
    shenimTekst: string,
    ratings: { skillCategoryId: string; vleresimi: SkillLevel }[]
  ) {
    setSubmitting(true);
    try {
      await api.post(`/lessons/${lessonId}/evaluation`, { shenimTekst, ratings });
      toast.success('Vlerësimi u ruajt, ora u shënua e përfunduar');
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      setEvaluatingId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë ruajtjes');
    } finally {
      setSubmitting(false);
    }
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!instructorId || !newSlot.data || !newSlot.oraFillimit || !newSlot.oraMbarimit) return;
    setAddingSlot(true);
    try {
      const slot = await api.post<AvailabilitySlot>(`/instructors/${instructorId}/availability`, newSlot);
      setSlots((prev) => [...prev, slot].sort((a, b) => (a.data + a.oraFillimit).localeCompare(b.data + b.oraFillimit)));
      setNewSlot({ data: '', oraFillimit: '', oraMbarimit: '' });
      toast.success('Disponueshmëria u shtua');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë shtimit');
    } finally {
      setAddingSlot(false);
    }
  }

  async function removeSlot(slotId: string) {
    try {
      await api.del(`/instructors/availability/${slotId}`);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë fshirjes');
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Paneli i Instruktorit</h1>
        <p className="text-sm text-ink-muted">Menaxho orarin, disponueshmërinë dhe vlerëso studentët.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarClock size={16} className="text-brand-500" /> Orari i Ardhshëm
          </div>
          {lessons.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">S&apos;ke orë të rezervuara.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {lessons.map((l) => (
                <div key={l.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm">
                      <p className="font-medium text-ink">{formatDateLong(l.data)} · {l.oraFillimit}-{l.oraMbarimit}</p>
                      <p className="text-ink-muted">Studenti: {l.student?.user.emri}</p>
                    </div>
                    <Badge tone="brand">{l.statusi}</Badge>
                  </div>
                  {evaluatingId === l.id ? (
                    <EvaluationForm
                      skills={skills}
                      submitting={submitting}
                      onCancel={() => setEvaluatingId(null)}
                      onSubmit={(text, ratings) => submitEvaluation(l.id, text, ratings)}
                    />
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEvaluatingId(l.id)}>
                        <CheckCircle2 size={14} /> Vlerëso &amp; Përfundo
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => markMungese(l.id)}>
                        <UserX size={14} /> Shëno Mungesë
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarPlus size={16} className="text-brand-500" /> Disponueshmëria
          </div>
          <form onSubmit={addSlot} className="mb-4 flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-muted p-3">
            <Input type="date" required value={newSlot.data} onChange={(e) => setNewSlot((s) => ({ ...s, data: e.target.value }))} />
            <div className="flex gap-2">
              <Input type="time" required value={newSlot.oraFillimit} onChange={(e) => setNewSlot((s) => ({ ...s, oraFillimit: e.target.value }))} />
              <Input type="time" required value={newSlot.oraMbarimit} onChange={(e) => setNewSlot((s) => ({ ...s, oraMbarimit: e.target.value }))} />
            </div>
            <Button type="submit" size="sm" disabled={addingSlot}>
              {addingSlot ? 'Duke shtuar...' : 'Shto Slot'}
            </Button>
          </form>

          {slots.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">S&apos;ke slote të lira.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {slots.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{formatDateLong(s.data)} · {s.oraFillimit}-{s.oraMbarimit}</span>
                  <button onClick={() => removeSlot(s.id)} className="text-ink-muted hover:text-danger-500" aria-label="Fshi">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}

export default function InstructorPage() {
  return (
    <AuthGate allowedRoles={['INSTRUCTOR']}>
      <InstructorContent />
    </AuthGate>
  );
}
