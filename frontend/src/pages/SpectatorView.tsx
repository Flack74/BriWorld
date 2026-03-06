import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface SpectatorState {
  status: string;
  current_round: number;
  total_rounds: number;
  scores: Record<string, number>;
  game_mode: string;
  players: number;
}

export function SpectatorView() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<SpectatorState | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/spectate/${roomCode}?username=Spectator`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'spectator_joined') {
        setState(data.payload);
      } else if (data.type === 'score_update') {
        setState(prev => prev ? { ...prev, scores: data.payload.scores } : null);
      } else if (data.type === 'round_started') {
        setState(prev => prev ? { ...prev, current_round: data.payload.current_round } : null);
      } else if (data.type === 'game_completed') {
        setState(prev => prev ? { ...prev, status: 'completed' } : null);
        setGameEnded(true);
        // Auto-redirect to waiting room after 5 seconds
        setTimeout(() => {
          const username = localStorage.getItem('username') || 'Guest';
          navigate('/waiting', { 
            state: { 
              roomCode, 
              username,
              gameMode: data.payload.game_mode || 'FLAG',
              roomType: 'PRIVATE'
            } 
          });
        }, 5000);
      }
    };
    
    setWs(socket);
    
    return () => {
      socket.close();
    };
  }, [roomCode]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Connecting to room...</div>
      </div>
    );
  }

  const sortedScores = Object.entries(state.scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">👁️ Spectator Mode</h1>
            <div className="text-right">
              <p className="text-sm opacity-80">Room: {roomCode}</p>
              <p className="text-sm opacity-80">{state.game_mode} Mode</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Status</p>
              <p className="text-2xl font-bold capitalize">{state.status}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Round</p>
              <p className="text-2xl font-bold">{state.current_round} / {state.total_rounds}</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
            <div className="space-y-3">
              {sortedScores.map(([player, score], index) => (
                <div 
                  key={player}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">
                      {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="text-xl font-semibold">{player}</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-300">{score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm opacity-60">
            {gameEnded ? (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                <p className="text-lg font-bold text-green-300">🎉 Game Ended!</p>
                <p className="mt-2">Joining room in 5 seconds...</p>
              </div>
            ) : (
              <p>You are watching this game in real-time</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
