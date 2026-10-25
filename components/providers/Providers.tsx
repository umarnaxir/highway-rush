'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/lib/ui/theme';
import { StoreHydrator } from './StoreHydrator';
import { GlobalAudio } from './GlobalAudio';
import { ToastViewport } from '@/components/ui/ToastViewport';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <StoreHydrator />
      <GlobalAudio />
      {children}
      <ToastViewport />
    </ThemeProvider>
  );
}
