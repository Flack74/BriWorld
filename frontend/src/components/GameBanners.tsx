interface BannerProps {
  show: boolean;
  country?: string;
}

export const SuccessBanner = ({ show, country }: BannerProps) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-5 duration-500">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-emerald-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-4 justify-center">
          <div className="text-3xl animate-bounce">🎉</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black tracking-tight">Correct!</div>
            <div className="text-sm font-medium truncate mt-0.5 opacity-90">{country}</div>
          </div>
          <div className="text-3xl animate-spin-slow">✨</div>
        </div>
      </div>
    </div>
  );
};

export const ErrorBanner = ({ show, country }: BannerProps) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-5 duration-500">
      <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-red-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-4 justify-center">
          <div className="text-3xl animate-shake">❌</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black tracking-tight">Wrong!</div>
            <div className="text-sm font-medium truncate mt-0.5 opacity-90">It was {country}</div>
          </div>
          <div className="text-3xl animate-pulse">😢</div>
        </div>
      </div>
    </div>
  );
};

export const TimeoutBanner = ({ show, country }: BannerProps) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-5 duration-500">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-orange-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-4 justify-center">
          <div className="text-3xl animate-bounce">⏰</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black tracking-tight">Time's Up!</div>
            <div className="text-sm font-medium truncate mt-0.5 opacity-90">{country}</div>
          </div>
          <div className="text-3xl animate-pulse">⌛</div>
        </div>
      </div>
    </div>
  );
};

export const AlreadyGuessedBanner = ({ show, country }: BannerProps) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-5 duration-500">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-blue-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-4 justify-center">
          <div className="text-3xl animate-bounce">🔄</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black tracking-tight">Already Guessed!</div>
            <div className="text-sm font-medium truncate mt-0.5 opacity-90">{country}</div>
          </div>
          <div className="text-3xl animate-pulse">✅</div>
        </div>
      </div>
    </div>
  );
};
