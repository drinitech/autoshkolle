'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { landingPathForRole } from '@/lib/roles';
import type { Role } from '@/lib/types';
import { Navbar } from './Navbar';

export function AuthGate({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const [mounted, setMounted] = useState(false);
  const { token, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(landingPathForRole(user.role));
    }
  }, [mounted, token, user, allowedRoles, router]);

  const roleOk = !allowedRoles || (user && allowedRoles.includes(user.role));

  if (!mounted || !token || !roleOk) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Duke ngarkuar...</div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
