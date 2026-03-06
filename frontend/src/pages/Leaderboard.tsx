import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry } from '@/types/ranking';
import RankBadge from '@/components/RankBadge';
import { ArrowLeft } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh leaderboard every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/v2/leaderboard?limit=100');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <h1 className="text-4xl font-bold mb-8 text-center">🏆 Global Leaderboard</h1>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Rating</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-xl">
                        {index === 0 && '👑'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.username}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${entry.avatar_url ? 'hidden' : ''}`}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-lg">{entry.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-lg">
                      {entry.rating}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <RankBadge rank={entry.rank} tier={entry.rank_tier} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No players on the leaderboard yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}
