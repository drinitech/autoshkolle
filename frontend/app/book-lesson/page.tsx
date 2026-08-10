'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Clock, User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthGate } from '@/components/AuthGate';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { formatDateLong } from '@/lib/format';
import type { AvailabilitySlot, InstructorSummary } from '@/lib/types';

function groupByDate(slots: AvailabilitySlot[]) {
  const map = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = slot.data.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function BookLessonContent() {
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    api.get<InstructorSummary[]>('/instructors').then((res) => {
      setInstructors(res);
      if (res[0]) setSelectedInstructor(res[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedInstructor) return;
    setLoading(true);
    api
      .get<AvailabilitySlot[]>(`/instructors/${selectedInstructor}/availability`)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [selectedInstructor]);

  async function bookSlot(slotId: string) {
    setBooking(slotId);
    try {
      await api.post('/lessons', { slotId });
      toast.success('Ora u rezervua me sukses!');
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Rezervimi dështoi');
      // slot-i mund të jetë zënë ndërkohë nga dikush tjetër — rifresko listën
      const fresh = await api.get<AvailabilitySlot[]>(`/instructors/${selectedInstructor}/availability`);
      setSlots(fresh);
    } finally {
      setBooking(null);
    }
  }

  const grouped = groupByDate(slots);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Rezervo Orë Praktike</h1>
        <p className="text-sm text-ink-muted">Zgjidh instruktorin dhe një slot të lirë.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {instructors.map((inst) => (
          <button
            key={inst.id}
            onClick={() => setSelectedInstructor(inst.id)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
              selectedInstructor === inst.id
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-border-subtle bg-surface text-ink-muted hover:bg-surface-muted'
            }`}
          >
            <User size={14} /> {inst.user.emri}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : grouped.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-muted">S&apos;ka slote të lira për këtë instruktor.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, daySlots]) => (
            <Card key={date}>
              <p className="mb-3 text-sm font-semibold text-ink">{formatDateLong(date)}</p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="secondary"
                    size="sm"
                    disabled={booking === slot.id}
                    onClick={() => bookSlot(slot.id)}
                    className="gap-1.5"
                  >
                    <Clock size={13} />
                    {slot.oraFillimit} - {slot.oraMbarimit}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookLessonPage() {
  return (
    <AuthGate allowedRoles={['STUDENT']}>
      <BookLessonContent />
    </AuthGate>
  );
}
