import { Globe as GlobeIcon } from "lucide-react";

export const Globe = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-game-ocean/20 blur-3xl animate-pulse-slow" />
      
      {/* Globe container */}
      <div className="relative">
        {/* Rotating rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[120%] h-[120%] border-2 border-primary/20 rounded-full animate-spin-slow" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[140%] h-[140%] border border-primary/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
        </div>
        
        {/* Main globe */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full gradient-ocean shadow-2xl flex items-center justify-center animate-float">
          {/* Continent-like patterns */}
          <div className="absolute inset-2 rounded-full bg-game-land/40 blur-sm" 
               style={{ 
                 clipPath: 'polygon(20% 20%, 40% 15%, 60% 25%, 70% 45%, 65% 70%, 45% 80%, 25% 65%, 15% 40%)',
               }} />
          <div className="absolute inset-4 rounded-full bg-game-land/30 blur-sm" 
               style={{ 
                 clipPath: 'polygon(60% 15%, 85% 25%, 90% 50%, 80% 75%, 55% 60%, 50% 35%)',
               }} />
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
          
          {/* Icon overlay */}
          <GlobeIcon className="w-10 h-10 md:w-14 md:h-14 text-white/90 drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
};
