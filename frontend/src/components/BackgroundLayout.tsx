import { ReactNode } from 'react';

interface BackgroundLayoutProps {
  children: ReactNode;
}

export const BackgroundLayout = ({ children }: BackgroundLayoutProps) => {
  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: 'url(/hero-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-gradient" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
