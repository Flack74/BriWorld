import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-14 h-14 rounded-2xl bg-background/10 backdrop-blur-xl border border-border/20 hover:bg-background/20 transition-all"
    >
      {theme === 'light' ? (
        <Moon className="w-6 h-6 text-foreground" />
      ) : (
        <Sun className="w-6 h-6 text-foreground" />
      )}
    </Button>
  );
};
