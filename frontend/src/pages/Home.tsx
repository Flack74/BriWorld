import { Globe } from "@/components/Globe";
import { Button } from "@/components/ui/button";
import { Gamepad2, LogIn, UserPlus, LogOut, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-2 sm:px-4">
      <ThemeToggle />
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-32 h-32 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-10 w-48 h-48 sm:w-96 sm:h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-game-ocean/5 rounded-full blur-3xl" />
      </div>

      {/* Logout button for logged in users */}
      {isLoggedIn && (
        <div className="absolute top-6 right-2 sm:right-6 z-20 flex items-center gap-1 sm:gap-3">
          <span className="text-xs sm:text-sm text-foreground hidden sm:block">Welcome, {username}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 animate-fade-in">
        {/* Logo & Globe */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <Globe className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40" />
          
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Bri</span>
              <span className="bg-gradient-to-r from-[hsl(200,85%,45%)] via-[hsl(185,70%,35%)] to-[hsl(170,60%,40%)] bg-clip-text text-transparent">World</span>
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-lg lg:text-xl text-muted-foreground font-medium">
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
                onClick={() => navigate("/login")}
              >
                <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                Login
              </Button>
              
              <Button
                variant="glass"
                size="lg"
                className="gap-1 sm:gap-2 h-10 sm:h-12"
                onClick={() => navigate("/register")}
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Features hint */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 mt-3 sm:mt-4 lg:mt-8 text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
            <span className="text-sm sm:text-base lg:text-lg">🚩</span>
            <span>Flag Quiz</span>
          </div>
          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-border" />
          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
            <span className="text-sm sm:text-base lg:text-lg">🗺️</span>
            <span>World Map</span>
          </div>
          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-border" />
          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
            <span className="text-sm sm:text-base lg:text-lg">👥</span>
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
              <span>Created with love and respect for Briella Chawla.</span>
            </div>
            <p className="text-xs text-muted-foreground">Made with care</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
