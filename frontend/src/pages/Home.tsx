import { Globe } from "@/components/Globe";
import { Button } from "@/components/ui/button";
import { Gamepad2, LogIn, UserPlus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-earth flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-game-ocean/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 animate-fade-in">
        {/* Logo & Globe */}
        <div className="flex flex-col items-center gap-6">
          <Globe className="w-32 h-32 md:w-40 md:h-40" />
          
          <div className="text-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Bri</span>
              <span className="bg-gradient-to-r from-[hsl(200,85%,45%)] via-[hsl(185,70%,35%)] to-[hsl(170,60%,40%)] bg-clip-text text-transparent">World</span>
            </h1>
            <p className="mt-3 text-lg md:text-xl text-muted-foreground font-medium">
              Multiplayer Geography Quiz Game
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 mt-4">
          {/* Primary CTA */}
          <Button
            variant="game"
            size="xl"
            className="min-w-[240px] group"
            onClick={() => navigate("/lobby")}
          >
            <Gamepad2 className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Play Now
          </Button>

          {/* Secondary Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="glass"
              size="lg"
              className="gap-2"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>
            
            <Button
              variant="glass"
              size="lg"
              className="gap-2"
              onClick={() => navigate("/register")}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Button>
          </div>
        </div>

        {/* Features hint */}
        <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚩</span>
            <span>Flag Quiz</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🗺️</span>
            <span>World Map</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
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
    </div>
  );
};

export default Home;
