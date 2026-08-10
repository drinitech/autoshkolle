'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { landingPathForRole } from '@/lib/roles';

export default function HomePage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    router.replace(token && user ? landingPathForRole(user.role) : '/login');
  }, [token, user, router]);

  return <div className="flex min-h-screen items-center justify-center text-ink-muted">Duke ngarkuar...</div>;
}
