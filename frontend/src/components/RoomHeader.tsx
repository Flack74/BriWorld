import { Hash } from "lucide-react";

interface RoomHeaderProps {
  roomNumber: string;
  isSingleRoom?: boolean;
}

const RoomHeader = ({ roomNumber, isSingleRoom = false }: RoomHeaderProps) => {
  return (
    <div className="card-elevated px-1 py-0.5 sm:px-2 sm:py-1 lg:px-5 lg:py-3 flex items-center gap-0.5 sm:gap-1 lg:gap-2.5 animate-fade-in">
      <Hash className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
      <span className="text-xs sm:text-sm lg:text-lg font-bold text-foreground tracking-wide tabular-nums">
        {isSingleRoom ? 'Single' : roomNumber}
      </span>
    </div>
  );
};

export default RoomHeader;
