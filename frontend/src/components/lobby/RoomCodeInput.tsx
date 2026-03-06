import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const RoomCodeInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="room-code" className="text-sm font-semibold">Room Code</Label>
      <Input
        id="room-code"
        type="text"
        className="h-12 text-center text-lg font-mono uppercase tracking-widest"
        placeholder="Enter 6-digit code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={6}
      />
      <p className="text-xs text-muted-foreground text-center">
        Leave empty to create a new room
      </p>
    </div>
  );
};
