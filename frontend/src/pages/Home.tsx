import { Play, Flag, Map, Users, LogIn, UserPlus, Menu, Heart, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(/hero-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-end px-6 py-4">
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="glass-nav flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-primary/40 relative z-30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate("/login")}
                className="glass-nav flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-primary/40 relative z-30"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              <button 
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 rounded-lg bg-primary/20 border border-primary/50 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/30 relative z-30"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="glass-nav rounded-lg p-2.5 transition-colors hover:border-primary/40 relative z-30">
                <Menu className="h-5 w-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900/95 backdrop-blur-xl border-white/10 relative z-40">
              <DropdownMenuItem 
                onClick={() => navigate('/about')}
                className="cursor-pointer text-white hover:bg-white/10"
              >
                About
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-2 overflow-y-auto">
        {/* Globe with orbital rings and glow */}
        <div className="mb-2 sm:mb-3 md:mb-4 flex-shrink-0 relative w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
          {/* Layered glow effects */}
          <div className="absolute inset-0 animate-pulse-slow">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl scale-110" />
            <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-xl scale-125" />
          </div>
          
          {/* Orbital ring 1 with dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[150%] h-[150%] border-2 border-primary/30 rounded-full animate-spin-slow" />
            <div className="absolute w-[150%] h-[150%] animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
            </div>
          </div>
          
          {/* Orbital ring 2 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[180%] h-[180%] border border-blue-400/15 rounded-full" style={{ animation: 'spin 35s linear infinite reverse' }} />
          </div>
          
          {/* Orbital ring 3 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[210%] h-[210%] border border-cyan-300/10 rounded-full" style={{ animation: 'spin 50s linear infinite' }} />
          </div>
          
          {/* Orbital ring 4 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[240%] h-[240%] border border-purple-400/8 rounded-full" style={{ animation: 'spin 65s linear infinite reverse' }} />
          </div>
          
          {/* Enhanced Globe Image */}
          {/* <img
            src="/globe.png"
            alt="BriWorld Globe"
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl opacity-90"
            style={{
              filter: 'contrast(1.0) brightness(0.95) saturate(1.2) drop-shadow(0 0 15px rgba(34, 211, 238, 0.3))'
            }}
          /> */}
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tight mb-1 sm:mb-2 md:mb-3 flex-shrink-0">
          <span className="text-white">Bri</span>
          <span className="text-primary">World</span>
        </h1>

        <p className="text-white/80 text-sm sm:text-base md:text-xl lg:text-2xl italic mb-2 sm:mb-3 md:mb-4 font-light flex-shrink-0">
          Multiplayer Geography Quiz Game
        </p>

        {/* Play Now */}
        <button 
          onClick={() => navigate("/lobby")}
          className="btn-play flex items-center gap-1.5 sm:gap-2 md:gap-3 rounded-lg sm:rounded-xl px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:scale-105 mb-2 sm:mb-3 md:mb-4 shadow-2xl flex-shrink-0"
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          Play Now
        </button>

        {/* Feature buttons */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          <button className="glass-card flex items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg md:rounded-xl px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
            <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-400" />
            Flag Quiz
          </button>
          <button className="glass-card flex items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg md:rounded-xl px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
            <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
            World Map
          </button>
          <button className="glass-card flex items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg md:rounded-xl px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
            Multiplayer
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-3 sm:pb-4 md:pb-6 flex-shrink-0">
        <div className="text-center">
          <p className="text-white/70 text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-400 fill-red-400" />
            Created with love and respect for Briella.
          </p>
          <p className="text-white/50 text-xs sm:text-sm md:text-sm mt-0.5 sm:mt-1 md:mt-2">Made with care</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
