import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface GameModeLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * GameModeLayout - Standardized layout wrapper for all game modes
 * 
 * This component ensures consistent vertical centering, spacing, and
 * responsive behavior across all game modes (Flag, Silhouette, etc.)
 * 
 * Design Goals:
 * - No unnecessary scrollbars on normal screens
 * - Vertically centered content
 * - Consistent card styling
 * - Responsive scaling for mobile/tablet/desktop
 */
export function GameModeLayout({ children, title, subtitle, className = '' }: GameModeLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className={`w-full max-w-4xl mx-auto space-y-3 sm:space-y-4 ${className}`}>
        {title && (
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface GameCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function GameCard({ children, className = '', noPadding = false }: GameCardProps) {
  const paddingClass = noPadding ? '' : 'p-4 sm:p-6 md:p-8';
  return (
    <Card className={`glass-card ${paddingClass} ${className}`}>
      {children}
    </Card>
  );
}
