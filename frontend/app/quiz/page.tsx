'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { AuthGate } from '@/components/AuthGate';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { QUIZ_CATEGORY_LABELS } from '@/lib/types';
import type { QuizGenerateResponse, QuizQuestion, QuizSubmitResponse } from '@/lib/types';

type Stage = 'intro' | 'running' | 'result';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function QuizContent() {
  const { user } = useAuthStore();
  const [stage, setStage] = useState<Stage>('intro');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizGenerateResponse | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const startedAt = useRef<number>(0);

  const submitQuiz = useCallback(
    async (finalAnswers: Record<string, string | null>) => {
      if (!quiz || !user?.studentId) return;
      const kohaSekonda = Math.round((Date.now() - startedAt.current) / 1000);
      try {
        const res = await api.post<QuizSubmitResponse>('/quiz/submit', {
          studentId: user.studentId,
          kohaSekonda,
          answers: quiz.questions.map((q) => ({ questionId: q.id, answerId: finalAnswers[q.id] ?? null })),
        });
        setResult(res);
        setStage('result');
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Dërgimi i testit dështoi');
      }
    },
    [quiz, user?.studentId]
  );

  useEffect(() => {
    if (stage !== 'running' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

  useEffect(() => {
    if (stage === 'running' && secondsLeft === 0 && quiz) {
      submitQuiz(answers);
    }
  }, [secondsLeft, stage, quiz, answers, submitQuiz]);

  async function startQuiz() {
    setLoading(true);
    try {
      const res = await api.get<QuizGenerateResponse>(`/quiz/generate?studentId=${user?.studentId}`);
      setQuiz(res);
      setAnswers({});
      setCurrent(0);
      setSecondsLeft(res.timeLimitMinutes * 60);
      startedAt.current = Date.now();
      setStage('running');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'S\'u gjenerua dot testi');
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId: string, answerId: string) {
    setAnswers((a) => ({ ...a, [questionId]: answerId }));
  }

  function next() {
    if (!quiz) return;
    if (current < quiz.questions.length - 1) setCurrent((c) => c + 1);
    else submitQuiz(answers);
  }

  if (stage === 'intro') {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
        <h1 className="text-xl font-bold text-ink">Testi i Teorisë</h1>
        <p className="text-sm text-ink-muted">
          Simulim i testit real: 40 pyetje, 25 minuta. Pyetjet përshtaten sipas kategorive ku ke gabuar më shpesh më parë.
        </p>
        <Button onClick={startQuiz} disabled={loading}>
          {loading ? 'Duke përgatitur...' : 'Fillo Testin'}
        </Button>
      </Card>
    );
  }

  if (stage === 'running') {
    if (!quiz) return <Skeleton className="h-64" />;
    const q: QuizQuestion = quiz.questions[current];
    const selected = answers[q.id];

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Badge tone="brand">{current + 1}/{quiz.questions.length}</Badge>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Clock3 size={16} className={secondsLeft < 60 ? 'text-danger-500' : 'text-ink-muted'} />
            {formatTime(secondsLeft)}
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        <Card>
          <Badge tone="muted" className="mb-3">{QUIZ_CATEGORY_LABELS[q.kategoria]}</Badge>
          <p className="mb-4 text-base font-semibold text-ink">{q.teksti}</p>
          {q.imazhi && <img src={q.imazhi} alt="" className="mb-4 max-h-48 rounded-xl object-contain" />}
          <div className="flex flex-col gap-2">
            {q.answers.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAnswer(q.id, a.id)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  selected === a.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border-subtle bg-surface hover:bg-surface-muted'
                }`}
              >
                {a.teksti}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={next}>{current < quiz.questions.length - 1 ? 'Pyetja tjetër' : 'Dorëzo Testin'}</Button>
        </div>
      </div>
    );
  }

  if (stage === 'result' && result && quiz) {
    const byCategory: Record<string, { total: number; correct: number }> = {};
    quiz.questions.forEach((q) => {
      const b = result.breakdown.find((x) => x.questionId === q.id);
      if (!byCategory[q.kategoria]) byCategory[q.kategoria] = { total: 0, correct: 0 };
      byCategory[q.kategoria].total += 1;
      if (b?.eSakte) byCategory[q.kategoria].correct += 1;
    });

    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          {result.iKaluar ? (
            <CheckCircle2 size={40} className="text-ok-500" />
          ) : (
            <XCircle size={40} className="text-danger-500" />
          )}
          <h1 className="text-2xl font-bold text-ink">{result.rezultati}%</h1>
          <p className="text-sm text-ink-muted">{result.saktesia} përgjigje të sakta</p>
          <Badge tone={result.iKaluar ? 'ok' : 'danger'}>{result.iKaluar ? 'Kalove testin!' : 'S\'u kalua — provo përsëri'}</Badge>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Rezultati sipas kategorive</p>
          <div className="flex flex-col gap-2">
            {Object.entries(byCategory).map(([cat, v]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{QUIZ_CATEGORY_LABELS[cat as keyof typeof QUIZ_CATEGORY_LABELS]}</span>
                <span className="font-semibold text-ink">{v.correct}/{v.total}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Rishiko pyetjet e gabuara</p>
          <div className="flex flex-col divide-y divide-border-subtle">
            {quiz.questions.map((q) => {
              const b = result.breakdown.find((x) => x.questionId === q.id);
              if (b?.eSakte) return null;
              const correctAnswer = q.answers.find((a) => a.id === b?.correctAnswerId);
              return (
                <div key={q.id} className="py-3 text-sm">
                  <p className="font-medium text-ink">{q.teksti}</p>
                  <p className="mt-1 text-ok-500">Përgjigja e saktë: {correctAnswer?.teksti}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Button onClick={() => setStage('intro')} className="self-center">Bëj Test Tjetër</Button>
      </div>
    );
  }

  return null;
}

export default function QuizPage() {
  return (
    <AuthGate allowedRoles={['STUDENT']}>
      <QuizContent />
    </AuthGate>
  );
}
