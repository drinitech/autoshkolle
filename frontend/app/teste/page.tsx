'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Car, ChevronDown, Clock3, GraduationCap, ListChecks, Lock, Target, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { withNext } from '@/lib/next-path';
import { Navbar } from '@/components/Navbar';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { QUIZ_CATEGORY_LABELS } from '@/lib/types';
import type { QuizCatalog, QuizCategory } from '@/lib/types';

const CATEGORY_DESCRIPTIONS: Record<QuizCategory, string> = {
  SHENJA_RRUGORE: 'Shenjat e rrezikut, të ndalimit, të detyrimit dhe ato informuese.',
  RREGULLA: 'Shpejtësia, lëvizja në kryqëzime, tejkalimi dhe sinjalizimi.',
  SIGURIA: 'Distanca e sigurisë, rripi, alkooli dhe vozitja në mot të keq.',
  PARKIMI: 'Ku lejohet dhe ku ndalohet ndalimi dhe parkimi.',
  PERPARESIA: 'Kush kalon i pari: kryqëzimet, rrethrrotullimet dhe automjetet me përparësi.',
};

/** quizPath(undefined) is the full exam; quizPath('PARKIMI') a 10-question practice test. */
function quizPath(kategoria?: QuizCategory) {
  return kategoria ? `/quiz?kategoria=${kategoria}` : '/quiz';
}

export default function TestsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  // Persisted auth is only readable after mount (see the note in lib/auth-store.ts).
  const [mounted, setMounted] = useState(false);
  const [catalog, setCatalog] = useState<QuizCatalog | null>(null);
  const [error, setError] = useState(false);
  const [pendingTest, setPendingTest] = useState<{ path: string; title: string } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    api
      .get<QuizCatalog>('/quiz/catalog')
      .then(setCatalog)
      .catch(() => setError(true));
  }, []);

  const loggedIn = mounted && !!token && !!user;

  function start(path: string, title: string) {
    if (!loggedIn) {
      setPendingTest({ path, title });
      return;
    }
    if (user?.role !== 'STUDENT') {
      toast.info('Testet janë për kandidatët. Kyçu me një llogari studenti për t\'i bërë.');
      return;
    }
    router.push(path);
  }

  return (
    <div className="min-h-screen">
      {loggedIn ? <Navbar /> : <PublicHeader />}

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 flex flex-col gap-3">
          <Badge tone="brand" className="self-start">Falas për kandidatët e regjistruar</Badge>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Testet e teorisë për patentë shoferi</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Shiko testet dhe pyetjet shembull pa llogari. Për ta bërë një test, krijo një llogari falas ose kyçu, që
            rezultatet dhe progresi yt të ruhen dhe testet e ardhshme të përqendrohen te kategoritë ku gabon më shumë.
          </p>
        </section>

        {error && (
          <Card className="text-sm text-danger-500">
            Testet nuk u ngarkuan. Serveri mund të jetë duke u zgjuar, provo përsëri pas pak sekondash.
          </Card>
        )}

        {!catalog && !error && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        )}

        {catalog && (
          <div className="flex flex-col gap-8">
            <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-50 to-surface">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                      <GraduationCap size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-ink">Testi i plotë: simulim i provimit</h2>
                      <p className="text-xs text-ink-muted">Pyetje nga të gjitha kategoritë, si në provimin real</p>
                    </div>
                  </div>
                  <TestFacts
                    questions={catalog.fullTest.questionCount}
                    minutes={catalog.fullTest.timeLimitMinutes}
                    pass={catalog.fullTest.passThreshold}
                  />
                  <p className="text-xs text-ink-muted">
                    Zgjedhur nga një bankë me {catalog.fullTest.totalQuestions} pyetje. Përshtatet sipas gabimeve të tua të mëparshme.
                  </p>
                </div>
                <StartButton loggedIn={loggedIn} onClick={() => start(quizPath(), 'Testi i plotë')} className="sm:self-center" />
              </div>
            </Card>

            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Ushtro sipas kategorisë</h2>
                <p className="text-sm text-ink-muted">
                  Teste të shkurtra me {catalog.practice.questionCount} pyetje nga një temë e vetme.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {catalog.categories.map((c) => {
                  const title = QUIZ_CATEGORY_LABELS[c.kategoria];
                  const available = c.totalQuestions > 0;
                  return (
                    <Card key={c.kategoria} className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-ink">{title}</h3>
                          <p className="mt-1 text-sm text-ink-muted">{CATEGORY_DESCRIPTIONS[c.kategoria]}</p>
                        </div>
                        <Badge tone="muted" className="shrink-0">{c.totalQuestions} pyetje</Badge>
                      </div>
                      <TestFacts
                        questions={Math.min(catalog.practice.questionCount, c.totalQuestions)}
                        minutes={catalog.practice.timeLimitMinutes}
                        pass={catalog.fullTest.passThreshold}
                      />
                      {c.sample && <SampleQuestion sample={c.sample} />}
                      <StartButton
                        loggedIn={loggedIn}
                        disabled={!available}
                        onClick={() => start(quizPath(c.kategoria), `Ushtrim: ${title}`)}
                        className="mt-auto self-start"
                      />
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {pendingTest && <AuthChoiceDialog test={pendingTest} onClose={() => setPendingTest(null)} />}
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/teste" className="flex items-center gap-2 font-bold text-brand-600">
          <Car size={20} />
          <span>Autoshkolla</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted">
            Kyçu
          </Link>
          <Link href="/register" className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Regjistrohu
          </Link>
        </div>
      </div>
    </header>
  );
}

function TestFacts({ questions, minutes, pass }: { questions: number; minutes: number; pass: number }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
      <li className="flex items-center gap-1.5"><ListChecks size={15} /> {questions} pyetje</li>
      <li className="flex items-center gap-1.5"><Clock3 size={15} /> {minutes} min</li>
      <li className="flex items-center gap-1.5"><Target size={15} /> kalon me {pass}%</li>
    </ul>
  );
}

function StartButton({
  loggedIn,
  onClick,
  disabled,
  className,
}: {
  loggedIn: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      {!loggedIn && <Lock size={15} className="mr-1.5 inline" />}
      {disabled ? 'S\'ka pyetje ende' : 'Fillo testin'}
    </Button>
  );
}

/** A sample question with its options; the correct answer is never sent to the browser here. */
function SampleQuestion({ sample }: { sample: NonNullable<QuizCatalog['categories'][number]['sample']> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-muted/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-medium text-ink"
      >
        Shiko një pyetje shembull
        <ChevronDown size={16} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border-subtle px-3.5 py-3">
          <p className="text-sm font-medium text-ink">{sample.teksti}</p>
          {sample.imazhi && <img src={sample.imazhi} alt="" className="mt-2 max-h-32 rounded-lg object-contain" />}
          <ul className="mt-2 flex flex-col gap-1.5">
            {sample.answers.map((a, i) => (
              <li key={a.id} className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-ink-muted">
                <span className="mr-2 font-semibold text-ink">{String.fromCharCode(65 + i)}.</span>
                {a.teksti}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">Përgjigjen e saktë e sheh kur e bën testin.</p>
        </div>
      )}
    </div>
  );
}

function AuthChoiceDialog({ test, onClose }: { test: { path: string; title: string }; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-choice-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="auth-choice-title" className="text-lg font-bold text-ink">Për të filluar testin</h2>
            <p className="mt-1 text-sm text-ink-muted">
              <span className="font-medium text-ink">{test.title}</span> kërkon llogari, që rezultatet të ruhen.
            </p>
          </div>
          <button onClick={onClose} aria-label="Mbyll" className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={withNext('/register', test.path)}
            className="rounded-xl bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-600"
          >
            Krijo llogari falas
          </Link>
          <Link
            href={withNext('/login', test.path)}
            className="rounded-xl border border-border-subtle px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            Kam llogari: Kyçu
          </Link>
        </div>
      </div>
    </div>
  );
}
