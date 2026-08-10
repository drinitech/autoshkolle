'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Card, Input } from '@/components/ui';
import type { AuthUser } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      setAuth(res.token, res.user);
      toast.success(`Mirë se erdhe, ${res.user.emri}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gabim gjatë hyrjes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Car size={22} />
          </div>
          <h1 className="text-lg font-bold text-ink">Autoshkolla</h1>
          <p className="text-sm text-ink-muted">Hyr në llogarinë tënde</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ti@shembull.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Fjalëkalimi</label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Duke hyrë...' : 'Hyr'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          S&apos;ke llogari?{' '}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            Regjistrohu
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Demo: student@... instruktor@... admin@autoshkolla.demo — fjalëkalimi Test1234
        </p>
      </Card>
    </div>
  );
}
