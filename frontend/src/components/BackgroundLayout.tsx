import { ReactNode } from 'react';

interface BackgroundLayoutProps {
  children: ReactNode;
}

export const BackgroundLayout = ({ children }: BackgroundLayoutProps) => {
  return (
    <>
      {/* Desktop/Tablet - Hero background */}
      <div 
        className="hidden md:block relative min-h-screen w-full overflow-hidden"
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

      {/* Mobile - Same as Home page */}
      <div className="md:hidden min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-5 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-game-ocean/5 rounded-full blur-3xl" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </>
  );
};
