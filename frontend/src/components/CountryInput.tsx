import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";

interface CountryInputProps {
  onSubmit: (country: string) => void;
}

const CountryInput = ({ onSubmit }: CountryInputProps) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-slide-up">
      <div className={`card-elevated p-1 sm:p-2 flex gap-1 sm:gap-2 lg:gap-3 items-center border border-transparent sm:border-2 transition-all duration-300 ${
        isFocused 
          ? "border-primary/50 shadow-glow-primary" 
          : "border-transparent"
      }`}>
        <div className="pl-1 sm:pl-2 lg:pl-3 text-primary">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
        </div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type any country name..."
          className="flex-1 border-0 bg-transparent text-xs sm:text-sm lg:text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground font-medium"
        />
        <Button
          type="submit"
          className="px-2 py-2 sm:px-4 sm:py-3 lg:px-8 lg:py-6 text-xs sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl gradient-primary shadow-glow-primary btn-primary-glow gap-0.5 sm:gap-1 lg:gap-2"
        >
          <span className="hidden lg:inline">Submit</span>
          <Send className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CountryInput;
