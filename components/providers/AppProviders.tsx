'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from './SessionProvider';
import { CoursesProvider } from './CoursesProvider';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CoursesProvider>{children}</CoursesProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
            duration: 5000,
          },
        }}
      />
    </SessionProvider>
  );
}
