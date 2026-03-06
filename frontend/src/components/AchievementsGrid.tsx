import { useEffect, useState } from 'react';
import { Achievement } from '@/types/meta';

export function AchievementsGrid() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetch('/api/v2/achievements', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setAchievements(data.achievements || []))
      .catch(err => console.error('Failed to load achievements:', err));
  }, []);

  const rarityColors = {
    COMMON: 'border-gray-400 bg-gray-50',
    RARE: 'border-blue-400 bg-blue-50',
    EPIC: 'border-purple-400 bg-purple-50',
    LEGENDARY: 'border-yellow-400 bg-yellow-50',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🏅 Achievements
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`border-2 ${rarityColors[achievement.rarity]} dark:bg-gray-700 rounded-lg p-4 text-center hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className="text-4xl mb-2">{achievement.icon}</div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
              {achievement.name}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {achievement.description}
            </p>
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-yellow-600">
              <span>+{achievement.reward}</span>
              <span>XP</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                achievement.rarity === 'LEGENDARY' ? 'bg-yellow-200 text-yellow-800' :
                achievement.rarity === 'EPIC' ? 'bg-purple-200 text-purple-800' :
                achievement.rarity === 'RARE' ? 'bg-blue-200 text-blue-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {achievement.rarity}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No achievements unlocked yet</p>
          <p className="text-sm mt-2">Start playing to earn achievements!</p>
        </div>
      )}
    </div>
  );
}
