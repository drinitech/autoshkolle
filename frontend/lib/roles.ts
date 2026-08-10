import type { Role } from './types';

export function landingPathForRole(role: Role): string {
  if (role === 'INSTRUCTOR') return '/instructor';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}
