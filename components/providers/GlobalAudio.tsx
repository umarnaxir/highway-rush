'use client';

import { usePathname } from 'next/navigation';
import { useMenuAudio } from '@/lib/hooks/useMenuAudio';

/** Owns menu music for every non-racing route. */
export function GlobalAudio() {
  const pathname = usePathname();
  const racing = pathname === '/play';
  useMenuAudio('menu', undefined, !racing);
  return null;
}
