'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, GraduationCap, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { AuthGate } from '@/components/AuthGate';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { ProgressRing } from '@/components/ProgressRing';
import { formatDateShort } from '@/lib/format';
import type { DrivingLesson, StudentProgress } from '@/lib/types';

const READINESS_LABEL: Record<StudentProgress['gatishmeria'], { text: string; tone: 'ok' | 'warn' | 'danger' }> = {
  JESHIL: { text: 'Gati për provim', tone: 'ok' },
  VERDHE: { text: 'Në progres', tone: 'warn' },
  KUQ: { text: 'Fillim i udhëtimit', tone: 'danger' },
};

function DashboardContent() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    Promise.all([
      api.get<StudentProgress>(`/students/${user.studentId}/progress`),
      api.get<DrivingLesson[]>('/lessons'),
    ])
      .then(([p, l]) => {
        setProgress(p);
        setLessons(l.filter((x) => x.statusi === 'REZERVUAR').slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [user?.studentId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const readiness = progress ? READINESS_LABEL[progress.gatishmeria] : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Mirë se erdhe, {user?.emri?.split(' ')[0]}</h1>
        <p className="text-sm text-ink-muted">Ja ku qëndron progresi yt drejt patentës.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-2 sm:col-span-1">
          <ProgressRing percent={progress?.ore.perqindja || 0} label="orë praktike" />
          {readiness && <Badge tone={readiness.tone}>{readiness.text}</Badge>}
        </Card>

        <Card className="sm:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <TrendingUp size={16} className="text-brand-500" /> Përmbledhje
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-muted">Orë të kryera</p>
              <p className="text-lg font-bold text-ink">{progress?.ore.kryera} / {progress?.ore.minimumi}</p>
            </div>
            <div>
              <p className="text-ink-muted">Rezultati më i mirë (quiz)</p>
              <p className="text-lg font-bold text-ink">
                {progress?.quizMeMireRezultat ? `${progress.quizMeMireRezultat.rezultati}%` : '—'}
              </p>
            </div>
          </div>
          <Link href="/quiz">
            <Button className="mt-4 w-full sm:w-auto">
              <GraduationCap size={16} /> Fillo Test Teorie
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarClock size={16} className="text-brand-500" /> Orët e ardhshme
          </div>
          <Link href="/book-lesson" className="text-xs font-semibold text-brand-600 hover:underline">
            Rezervo orë të re
          </Link>
        </div>
        {lessons.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">S&apos;ke ende orë të rezervuara.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle">
            {lessons.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{formatDateShort(l.data)}</p>
                  <p className="text-ink-muted">{l.oraFillimit} - {l.oraMbarimit} · me {l.instructor?.user.emri}</p>
                </div>
                <Badge tone="brand">{l.statusi}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
