import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Star } from 'lucide-react';

interface QuickStats {
  rank?: string;
  points?: number;
  achievementCount?: number;
}

export function MetaStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<QuickStats>({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch('/api/v2/rank', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/v2/achievements', { headers: { 'Authorization': `Bearer ${token}` } })
    ])
      .then(([rankRes, achRes]) => Promise.all([rankRes.json(), achRes.json()]))
      .then(([rankData, achData]) => {
        setStats({
          rank: rankData.rank || 'BRONZE',
          points: rankData.points || 0,
          achievementCount: achData.achievements?.length || 0
        });
      })
      .catch(() => {
        setStats({ rank: 'BRONZE', points: 0, achievementCount: 0 });
      });
  }, [token]);

  if (!token) return null;

  const rankIcons: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💠',
    DIAMOND: '💎'
  };

  return (
    <div 
      onClick={() => navigate('/profile')}
      className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-lg p-4 cursor-pointer hover:scale-105 transition-transform border border-purple-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Your Progress</h3>
        <span className="text-xs text-muted-foreground">View All →</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">Rank</span>
          </div>
          <span className="font-bold text-foreground">
            {rankIcons[stats.rank || 'BRONZE']} {stats.rank || 'BRONZE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">Points</span>
          </div>
          <span className="font-bold text-foreground">{stats.points || 0}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="text-muted-foreground">Achievements</span>
          </div>
          <span className="font-bold text-foreground">{stats.achievementCount}/13</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-purple-500/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">📅 Daily Challenge</span>
          <span className="text-green-500 font-semibold">Available</span>
        </div>
      </div>
    </div>
  );
}
