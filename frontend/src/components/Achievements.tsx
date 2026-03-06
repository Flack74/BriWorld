interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  type: string;
  unlocked_at?: number;
}

interface AchievementsProps {
  achievements: Record<string, Achievement>;
  progress: Record<string, number>;
}

export function Achievements({ achievements, progress }: AchievementsProps) {
  const allAchievements = [
    { id: 'explorer_10', name: 'Explorer', icon: '🌍', threshold: 10 },
    { id: 'explorer_50', name: 'World Traveler', icon: '✈️', threshold: 50 },
    { id: 'explorer_100', name: 'Globetrotter', icon: '🌐', threshold: 100 },
    { id: 'explorer_170', name: 'World Master', icon: '👑', threshold: 170 },
    { id: 'session_300', name: 'Patient Explorer', icon: '⏱️', threshold: 300 },
    { id: 'multiplayer_5', name: 'Social Explorer', icon: '👥', threshold: 5 },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">🏆 Achievements</h3>
      <div className="grid grid-cols-2 gap-2">
        {allAchievements.map((ach) => {
          const unlocked = achievements[ach.id];
          const currentProgress = progress[ach.id] || 0;
          const progressPercent = Math.min((currentProgress / ach.threshold) * 100, 100);

          return (
            <div
              key={ach.id}
              className={`rounded-lg p-3 text-center transition-all ${
                unlocked
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : 'bg-gray-900/50 border border-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">{ach.icon}</div>
              <p className={`text-xs font-semibold ${unlocked ? 'text-yellow-300' : 'text-gray-400'}`}>
                {ach.name}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div
                  className="bg-yellow-500 h-1 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentProgress}/{ach.threshold}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
