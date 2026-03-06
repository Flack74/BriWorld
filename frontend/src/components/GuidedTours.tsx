interface GuidedTour {
  id: string;
  name: string;
  description: string;
  region: string;
  countries: string[];
  icon: string;
  reward: number;
}

interface GuidedToursProps {
  tours: Record<string, GuidedTour>;
  exploredCountries: string[];
  onSelectTour: (tourId: string) => void;
}

export function GuidedTours({ tours, exploredCountries, onSelectTour }: GuidedToursProps) {
  const exploredSet = new Set(exploredCountries);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">🗺️ Guided Tours</h3>
      <div className="space-y-2">
        {Object.values(tours).map((tour) => {
          const completed = tour.countries.every(c => exploredSet.has(c));
          const progress = tour.countries.filter(c => exploredSet.has(c)).length;
          const progressPercent = (progress / tour.countries.length) * 100;

          return (
            <button
              key={tour.id}
              onClick={() => onSelectTour(tour.id)}
              className={`w-full text-left rounded-lg p-3 transition-all ${
                completed
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-gray-900/50 border border-gray-700 hover:border-teal-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {tour.icon} {tour.name}
                  </p>
                  <p className="text-xs text-gray-400">{tour.description}</p>
                </div>
                <span className="text-xs font-bold text-yellow-400">+{tour.reward}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress}/{tour.countries.length} countries
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
