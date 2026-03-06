import { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-4">
      {children}
    </div>
  );
}
