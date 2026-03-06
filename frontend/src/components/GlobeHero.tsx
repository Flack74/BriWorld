import { useTheme } from '@/contexts/ThemeContext';

export const GlobeHero = () => {
  const { theme } = useTheme();
  
  return (
    <div className="relative mb-12">
      {/* Large outer glow */}
      <div className="absolute inset-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div 
          className="absolute inset-0 rounded-full blur-[150px]"
          style={{
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(34, 211, 238, 0.5) 0%, rgba(16, 185, 129, 0.4) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, rgba(16, 185, 129, 0.3) 40%, transparent 70%)'
          }}
        />
      </div>
      
      {/* Orbit rings */}
      <div className="absolute inset-0 w-[380px] h-[380px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(103, 232, 249, 0.7)',
            animation: 'spin 25s linear infinite',
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 30px rgba(103, 232, 249, 0.6), 0 0 60px rgba(103, 232, 249, 0.4)'
          }}
        />
        <div 
          className="absolute inset-12 rounded-full"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.5)',
            animation: 'spin 20s linear infinite reverse',
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)'
          }}
        />
      </div>
      
      {/* Main Globe */}
      <div 
        className="relative w-80 h-80 rounded-full overflow-hidden"
        style={{ 
          boxShadow: theme === 'dark'
            ? '0 0 120px rgba(34, 211, 238, 0.8), 0 0 180px rgba(16, 185, 129, 0.6), 0 0 240px rgba(34, 211, 238, 0.4), inset -20px -20px 60px rgba(0, 0, 0, 0.3)'
            : '0 0 100px rgba(34, 211, 238, 0.6), 0 0 150px rgba(16, 185, 129, 0.5), inset -20px -20px 60px rgba(0, 0, 0, 0.2)'
        }}
      >
        <img src="/globe.png" alt="Globe" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};
