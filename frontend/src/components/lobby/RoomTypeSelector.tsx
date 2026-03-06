import React from "react";
import { RoomType } from "../../types/lobby";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Users, Globe } from "lucide-react";

interface Props {
  selected: RoomType;
  onChange: (type: RoomType) => void;
}

export const RoomTypeSelector: React.FC<Props> = ({ selected, onChange }) => {
  const options: { value: RoomType; label: string; icon: React.ReactNode }[] = [
    { value: "single", label: "Single Player", icon: <User className="w-4 h-4" /> },
    { value: "private", label: "Private Room", icon: <Users className="w-4 h-4" /> },
    { value: "public", label: "Public Room", icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Choose Room Type</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={selected === opt.value ? "default" : "outline"}
            className="h-12 gap-2"
            onClick={() => onChange(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
