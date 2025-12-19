import { Hash } from "lucide-react";

interface RoomHeaderProps {
  roomNumber: string;
  isSingleRoom?: boolean;
}

const RoomHeader = ({ roomNumber, isSingleRoom = false }: RoomHeaderProps) => {
  return (
    <div className="card-elevated px-5 py-3 flex items-center gap-2.5 animate-fade-in">
      <Hash className="w-4 h-4 text-primary" />
      <span className="text-lg font-bold text-foreground tracking-wide tabular-nums">
        {isSingleRoom ? 'Single Room' : roomNumber}
      </span>
    </div>
  );
};

export default RoomHeader;
