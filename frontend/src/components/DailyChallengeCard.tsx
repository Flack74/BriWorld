import { useEffect, useState } from 'react';
import { DailyChallenge } from '@/types/meta';

export function DailyChallengeCard() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);

  useEffect(() => {
    fetch('/api/v2/daily-challenge')
      .then(res => res.json())
      .then(data => setChallenge(data))
      .catch(() => {});
  }, []);

  if (!challenge) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 text-white shadow-xl">
        <h3 className="text-2xl font-bold mb-4">📅 Daily Challenge</h3>
        <p>Loading...</p>
      </div>
    );
  }

  const difficultyColors = {
    EASY: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HARD: 'bg-red-500',
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">📅 Daily Challenge</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColors[challenge.difficulty]}`}>
          {challenge.difficulty}
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-lg">Mode: <span className="font-semibold">{challenge.game_mode}</span></p>
        <p className="text-lg">Reward: <span className="font-semibold text-yellow-300">+{challenge.reward} XP</span></p>
      </div>

      <button className="mt-4 w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-gray-100 transition">
        Start Challenge
      </button>
    </div>
  );
}
