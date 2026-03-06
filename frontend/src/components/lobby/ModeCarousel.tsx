import React, { useRef, useEffect } from "react";
import { GameMode } from "../../types/lobby";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  modes: GameMode[];
  selectedMode: string | null;
  onSelect: (id: string) => void;
}

export const ModeCarousel: React.FC<Props> = ({
  modes,
  selectedMode,
  onSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Select Game Mode</Label>
      <div 
        className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth snap-x snap-mandatory"
        ref={scrollRef}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--primary)) transparent'
        }}
      >
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={cn(
              "flex-shrink-0 w-44 cursor-pointer transition-all duration-300 snap-center",
              selectedMode === mode.id 
                ? "ring-2 ring-primary shadow-lg shadow-primary/50" 
                : "hover:shadow-md"
            )}
            onClick={() => onSelect(mode.id)}
          >
            <CardContent className="p-4 text-center space-y-2">
              <div className="text-4xl mb-1">{mode.icon}</div>
              <h3 className="font-bold text-base leading-tight">{mode.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{mode.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
