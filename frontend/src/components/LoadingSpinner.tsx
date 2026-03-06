interface LoadingSpinnerProps {
  show: boolean;
  message?: string;
}

export const LoadingSpinner = ({ show, message = 'Loading next round...' }: LoadingSpinnerProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-card/90 backdrop-blur p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};
