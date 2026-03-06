import { useEffect, useState } from 'react';
import { SeasonRank } from '@/types/meta';

export function RankedSeasonCard() {
  const [rank, setRank] = useState<SeasonRank | null>(null);

  useEffect(() => {
    fetch('/api/v2/rank', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setRank(data))
      .catch(err => console.error('Failed to load rank:', err));
  }, []);

  if (!rank) return null;

  const rankColors = {
    BRONZE: 'from-orange-700 to-orange-900',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-cyan-400 to-cyan-600',
    DIAMOND: 'from-blue-400 to-purple-600',
  };

  const rankIcons = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💠',
    DIAMOND: '💎',
  };

  return (
    <div className={`bg-gradient-to-br ${rankColors[rank.rank]} rounded-lg p-6 text-white shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">🏆 Ranked Season</h3>
        <span className="text-4xl">{rankIcons[rank.rank]}</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-lg">Rank:</span>
          <span className="text-2xl font-bold">{rank.rank}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-lg">Points:</span>
          <span className="text-xl font-semibold">{rank.points}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span>W/L:</span>
          <span className="font-semibold">{rank.wins}W - {rank.losses}L</span>
        </div>
        
        <div className="mt-4 bg-black/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${Math.min((rank.points % 500) / 5, 100)}%` }}
          />
        </div>
        <p className="text-xs text-center opacity-80">
          {500 - (rank.points % 500)} points to next rank
        </p>
      </div>
    </div>
  );
}
