import { Globe } from "@/components/Globe";
import { Button } from "@/components/ui/button";
import { Gamepad2, LogIn, UserPlus, LogOut, Heart, Play, Flag, Map, Users, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { getOrCreateGuestUsername } from "@/lib/guestUsername";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (!token) {
      getOrCreateGuestUsername();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    getOrCreateGuestUsername();
    setIsLoggedIn(false);
  };

  return (
    <>
      {/* Mobile & Tablet View (md and below) */}
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-2 sm:px-4 md:hidden">
        {/* Top controls */}
        <div className="absolute top-6 left-2 sm:left-6 z-20 flex items-center gap-2">
          <ThemeToggle />
        </div>

        <div className="absolute top-6 right-2 sm:right-6 z-20 flex items-center gap-2">
          {isLoggedIn && (
            <>
              <span className="text-xs sm:text-sm text-foreground hidden sm:block">Welcome, {username}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-32 h-32 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-10 w-48 h-48 sm:w-96 sm:h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-game-ocean/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-4 animate-fade-in">
          {/* Logo & Globe */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <Globe className="w-24 h-24 sm:w-32 sm:h-32" />
            
            <div className="text-center">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-foreground">Bri</span>
                <span className="bg-gradient-to-r from-[hsl(200,85%,45%)] via-[hsl(185,70%,35%)] to-[hsl(170,60%,40%)] bg-clip-text text-transparent">World</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-muted-foreground font-medium">
                Multiplayer Geography Quiz Game
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
            {/* Primary CTA */}
            <Button
              variant="game"
              size="xl"
              className="min-w-[200px] sm:min-w-[240px] group h-12 sm:h-14"
              onClick={() => navigate("/lobby")}
            >
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse" />
              Play Now
            </Button>

            {/* Secondary Actions */}
            {!isLoggedIn && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="glass"
                  size="lg"
                  className="gap-1 sm:gap-2 h-10 sm:h-12"
                  onClick={() => navigate('/login')}
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  Login
                </Button>
                
                <Button
                  variant="glass"
                  size="lg"
                  className="gap-1 sm:gap-2 h-10 sm:h-12"
                  onClick={() => navigate('/register')}
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Features hint */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="text-sm sm:text-base">🚩</span>
              <span>Flag Quiz</span>
            </div>
            <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-border" />
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="text-sm sm:text-base">🗺️</span>
              <span>World Map</span>
            </div>
            <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-border" />
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="text-sm sm:text-base">👥</span>
              <span>Multiplayer</span>
            </div>
          </div>
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 z-10">
          <div className="w-full max-w-md mx-auto px-4">
            <div className="h-px bg-border/50 mb-4" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>Created with love and respect for Briella.</span>
              </div>
              <p className="text-xs text-muted-foreground">Made with care</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View (md and above) - Original Design */}
      <div
        className="hidden md:flex h-screen flex-col overflow-hidden"
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
          <div className="mb-2 sm:mb-3 md:mb-4 flex-shrink-0 relative w-48 h-48 lg:w-56 lg:h-56">
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
          </div>

          {/* Title */}
          <h1 className="text-6xl lg:text-8xl font-black tracking-tight mb-2 md:mb-3 flex-shrink-0">
            <span className="text-white">Bri</span>
            <span className="text-primary">World</span>
          </h1>

          <p className="text-white/80 text-xl lg:text-2xl italic mb-3 md:mb-4 font-light flex-shrink-0">
            Multiplayer Geography Quiz Game
          </p>

          {/* Play Now */}
          <button 
            onClick={() => navigate("/lobby")}
            className="btn-play flex items-center gap-2 md:gap-3 rounded-xl px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-bold text-white transition-all hover:scale-105 mb-3 md:mb-4 shadow-2xl flex-shrink-0"
          >
            <Play className="h-5 w-5 md:h-6 md:w-6" />
            Play Now
          </button>

          {/* Feature buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 flex-shrink-0">
            <button className="glass-card flex items-center gap-2 rounded-lg md:rounded-xl px-4 md:px-6 py-2 md:py-3 text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
              <Flag className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
              Flag Quiz
            </button>
            <button className="glass-card flex items-center gap-2 rounded-lg md:rounded-xl px-4 md:px-6 py-2 md:py-3 text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
              <Map className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              World Map
            </button>
            <button className="glass-card flex items-center gap-2 rounded-lg md:rounded-xl px-4 md:px-6 py-2 md:py-3 text-sm md:text-sm font-medium text-foreground dark:text-white transition-all hover:scale-105">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Multiplayer
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 pb-4 md:pb-6 flex-shrink-0">
          <div className="text-center">
            <p className="text-white/70 text-sm md:text-base flex items-center justify-center gap-2">
              <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-400 fill-red-400" />
              Created with love and respect for Briella.
            </p>
            <p className="text-white/50 text-sm md:text-sm mt-1 md:mt-2">Made with care</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
