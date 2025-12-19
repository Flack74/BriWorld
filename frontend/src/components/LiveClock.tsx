import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card-elevated px-5 py-3 flex items-center gap-2.5 animate-fade-in">
      <Clock className="w-4 h-4 text-primary" />
      <span className="text-lg font-semibold text-foreground tabular-nums tracking-wide">
        {time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </span>
    </div>
  );
};

export default LiveClock;
