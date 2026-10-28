'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { landingPathForRole } from '@/lib/roles';

export default function HomePage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    // Visitors without an account land on the public test catalog.
    router.replace(token && user ? landingPathForRole(user.role) : '/teste');
  }, [token, user, router]);

  return <div className="flex min-h-screen items-center justify-center text-ink-muted">Duke ngarkuar...</div>;
}
