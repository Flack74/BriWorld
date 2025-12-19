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
      <div className={`card-elevated p-2 flex gap-3 items-center border-2 transition-all duration-300 ${
        isFocused 
          ? "border-primary/50 shadow-glow-primary" 
          : "border-transparent"
      }`}>
        <div className="pl-3 text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type any country name..."
          className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground font-medium"
        />
        <Button
          type="submit"
          className="px-8 py-6 text-base font-bold rounded-xl gradient-primary shadow-glow-primary btn-primary-glow gap-2"
        >
          <span>Submit</span>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CountryInput;
