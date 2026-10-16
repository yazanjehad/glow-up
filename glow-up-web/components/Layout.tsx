import Header from '@/components/shared/Header';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
<div className="flex h-screen min-h-0 flex-col overflow-x-hidden bg-white">      <div className="shrink-0">
        <Header />
      </div>
      <main className="min-h-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
