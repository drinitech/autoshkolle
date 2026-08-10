'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Card, Input } from '@/components/ui';
import type { AuthUser, LicenseCategory } from '@/lib/types';

const CATEGORIES: LicenseCategory[] = ['A', 'B', 'C', 'D', 'BE', 'CE'];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ emri: '', email: '', telefoni: '', password: '', kategoria: 'B' as LicenseCategory });
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
        ...form,
        role: 'STUDENT',
      });
      setAuth(res.token, res.user);
      toast.success('Llogaria u krijua!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë regjistrimit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-surface-muted px-4 py-8">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Car size={22} />
          </div>
          <h1 className="text-lg font-bold text-ink">Regjistrohu si Student</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input required placeholder="Emri e Mbiemri" value={form.emri} onChange={(e) => update('emri', e.target.value)} />
          <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <Input placeholder="Telefoni (opsionale)" value={form.telefoni} onChange={(e) => update('telefoni', e.target.value)} />
          <Input required type="password" placeholder="Fjalëkalimi" value={form.password} onChange={(e) => update('password', e.target.value)} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Kategoria e patentës</label>
            <select
              value={form.kategoria}
              onChange={(e) => update('kategoria', e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Duke krijuar...' : 'Krijo Llogari'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Ke llogari?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Hyr
          </Link>
        </p>
      </Card>
    </div>
  );
}
