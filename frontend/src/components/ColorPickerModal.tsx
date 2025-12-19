import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface ColorOption {
  name: string;
  color: string;
}

const colors: ColorOption[] = [
  { name: "Ocean Blue", color: "#2B7A9B" },
  { name: "Coral Rose", color: "#C06C84" },
  { name: "Desert Sand", color: "#D4A373" },
  { name: "Royal Purple", color: "#7C3AED" },
  { name: "Sunset Orange", color: "#EA6A47" },
  { name: "Emerald Teal", color: "#14B8A6" },
  { name: "Forest Green", color: "#22C55E" },
  { name: "Berry Pink", color: "#EC4899" },
];

interface ColorPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  selectedColor?: string;
  takenColors?: string[];
}

export const ColorPickerModal = ({
  open,
  onClose,
  onSelectColor,
  selectedColor,
  takenColors = [],
}: ColorPickerModalProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none" hideClose>
        <div className="glass-card-strong rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">🎨</span>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                Choose Your Color
              </DialogTitle>
            </div>
            <p className="text-center text-muted-foreground text-sm">
              This color will mark your conquered countries on the map
            </p>
            {takenColors.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-center text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                  🔒 Locked colors are already taken by other players
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4">
            {colors.map((colorOption) => (
              <button
                key={colorOption.name}
                onClick={() => !takenColors.includes(colorOption.color) && onSelectColor(colorOption.color)}
                onMouseEnter={() => setHoveredColor(colorOption.color)}
                onMouseLeave={() => setHoveredColor(null)}
                disabled={takenColors.includes(colorOption.color)}
                className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                  takenColors.includes(colorOption.color) 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:scale-110'
                }`}
              >
                {/* Color circle */}
                <div
                  className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 group-hover:shadow-xl flex items-center justify-center ring-4 ring-transparent group-hover:ring-white/50"
                  style={{ 
                    backgroundColor: colorOption.color,
                    boxShadow: hoveredColor === colorOption.color 
                      ? `0 8px 30px ${colorOption.color}60` 
                      : undefined
                  }}
                >
                  {selectedColor === colorOption.color && (
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                  {takenColors.includes(colorOption.color) && selectedColor !== colorOption.color && (
                    <span className="text-2xl">🔒</span>
                  )}
                </div>

                {/* Color name */}
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                  {colorOption.name}
                </span>
              </button>
            ))}
          </div>

          {/* Selected color preview */}
          {selectedColor && (
            <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-2xl">
              <div
                className="w-8 h-8 rounded-full shadow-md"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-medium text-foreground">
                {colors.find(c => c.color === selectedColor)?.name || "Selected"}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
