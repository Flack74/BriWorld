import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Crown, MessageCircle, Clock, Trophy, Zap, Shield, Swords, Vote, Send, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Team = 'red' | 'blue';
type GamePhase = 'lobby' | 'question' | 'voting' | 'reveal' | 'result';

interface Player {
  id: string;
  name: string;
  team: Team;
  isLeader: boolean;
  hasVoted: boolean;
  avatar: string;
}

interface ChatMessage {
  id: string;
  player: string;
  team: Team;
  message: string;
  timestamp: Date;
}

const mockPlayers: Player[] = [
  { id: '1', name: 'You', team: 'red', isLeader: true, hasVoted: false, avatar: '🎮' },
  { id: '2', name: 'Alex', team: 'red', isLeader: false, hasVoted: true, avatar: '🎯' },
  { id: '3', name: 'Sam', team: 'red', isLeader: false, hasVoted: false, avatar: '🌟' },
  { id: '4', name: 'Jordan', team: 'blue', isLeader: true, hasVoted: true, avatar: '🎪' },
  { id: '5', name: 'Casey', team: 'blue', isLeader: false, hasVoted: true, avatar: '🎨' },
  { id: '6', name: 'Morgan', team: 'blue', isLeader: false, hasVoted: false, avatar: '🎭' },
];

const questionData = {
  question: "Which country has the largest land area?",
  options: ['Russia', 'Canada', 'United States', 'China'],
  correct: 'Russia',
  category: 'Geography',
};

export default function TeamBattle() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [players] = useState<Player[]>(mockPlayers);
  const [timeLeft, setTimeLeft] = useState(45);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [teamVotes, setTeamVotes] = useState<Record<string, number>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTeamChat, setShowTeamChat] = useState(true);

  const [myTeam] = useState<Team>('red');
  const redTeam = players.filter(p => p.team === 'red');
  const blueTeam = players.filter(p => p.team === 'blue');

  useEffect(() => {
    if ((phase === 'question' || phase === 'voting') && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && phase === 'question') {
      setPhase('voting');
      setTimeLeft(15);
    } else if (timeLeft === 0 && phase === 'voting') {
      setPhase('reveal');
      // Simulate score update
      setRedScore(s => s + 100);
    }
  }, [phase, timeLeft]);

  const startGame = () => {
    setPhase('question');
    setTimeLeft(45);
  };

  const handleVote = (answer: string) => {
    setSelectedAnswer(answer);
    setTeamVotes(prev => ({
      ...prev,
      [answer]: (prev[answer] || 0) + 1
    }));
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      player: 'You',
      team: myTeam,
      message: chatInput,
      timestamp: new Date(),
    }]);
    setChatInput('');
  };

  const nextRound = () => {
    setCurrentRound(r => r + 1);
    setPhase('question');
    setTimeLeft(45);
    setSelectedAnswer(null);
    setTeamVotes({});
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-red-950/30 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-950/30 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col lg:flex-row gap-4 md:gap-6 px-4 md:px-6 pb-6 h-[calc(100vh-80px)]">
        {phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto">
            {/* Title */}
            <div className="space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-2xl">
                <Swords className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold">
                <span className="text-red-400">Team</span>
                <span className="text-muted-foreground"> vs </span>
                <span className="text-blue-400">Team</span>
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Work together with your team to answer geography questions. Majority vote wins!
              </p>
            </div>

            {/* Teams Preview */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              {/* Red Team */}
              <div className="glass-panel p-4 border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-red-400">Red Team</span>
                </div>
                <div className="space-y-2">
                  {redTeam.map(player => (
                    <div key={player.id} className="flex items-center gap-2 text-sm">
                      <span>{player.avatar}</span>
                      <span>{player.name}</span>
                      {player.isLeader && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blue Team */}
              <div className="glass-panel p-4 border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-blue-400">Blue Team</span>
                </div>
                <div className="space-y-2">
                  {blueTeam.map(player => (
                    <div key={player.id} className="flex items-center gap-2 text-sm">
                      <span>{player.avatar}</span>
                      <span>{player.name}</span>
                      {player.isLeader && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 45s per round</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 6 players</span>
              <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> 10 rounds</span>
            </div>

            {/* Start Button */}
            <Button 
              onClick={startGame}
              size="lg"
              className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:opacity-90 shadow-xl"
            >
              Start Battle
            </Button>
          </div>
        )}

        {phase !== 'lobby' && (
          <>
            {/* Left Sidebar - Team Status */}
            <aside className="w-full lg:w-64 flex lg:flex-col gap-4 lg:gap-0 lg:space-y-4 order-2 lg:order-1">
              {/* Red Team Card */}
              <div className={cn(
                "flex-1 glass-panel p-3 md:p-4 transition-all",
                myTeam === 'red' && "ring-2 ring-red-500/50"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <span className="font-bold text-red-400">Red Team</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{redScore}</span>
                </div>
                <div className="hidden md:block space-y-2">
                  {redTeam.map(player => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{player.avatar}</span>
                        <span className={player.name === 'You' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {player.name}
                        </span>
                      </div>
                      {(phase === 'voting' || phase === 'question') && player.hasVoted && (
                        <Vote className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blue Team Card */}
              <div className={cn(
                "flex-1 glass-panel p-3 md:p-4 transition-all",
                myTeam === 'blue' && "ring-2 ring-blue-500/50"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-blue-400">Blue Team</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{blueScore}</span>
                </div>
                <div className="hidden md:block space-y-2">
                  {blueTeam.map(player => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{player.avatar}</span>
                        <span className="text-muted-foreground">{player.name}</span>
                      </div>
                      {phase === 'voting' && player.hasVoted && (
                        <Vote className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col gap-4 order-1 lg:order-2">
              {/* Timer and Round Info */}
              <div className="flex items-center justify-between glass-panel p-3 md:p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Round {currentRound}/10</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {questionData.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
                  <Clock className={cn(
                    "w-5 h-5",
                    timeLeft <= 10 ? "text-red-400" : "text-cyan-400"
                  )} />
                  <span className={cn(
                    "font-mono text-xl font-bold",
                    timeLeft <= 10 ? "text-red-400" : "text-cyan-400"
                  )}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Question Area */}
              <div className="flex-1 glass-panel p-4 md:p-6 flex flex-col">
                {phase === 'question' && (
                  <>
                    <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">
                      {questionData.question}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1 content-center">
                      {questionData.options.map((option, i) => (
                        <Button
                          key={i}
                          onClick={() => handleVote(option)}
                          variant="outline"
                          className={cn(
                            "py-6 md:py-8 text-base md:text-lg font-medium transition-all",
                            selectedAnswer === option 
                              ? "border-red-500 bg-red-500/20 text-red-400" 
                              : "hover:border-red-500/50 hover:bg-red-500/10"
                          )}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </>
                )}

                {phase === 'voting' && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Zap className="w-16 h-16 text-amber-400 animate-pulse mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Voting Phase</h2>
                    <p className="text-muted-foreground mb-6">Your team is voting...</p>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      {Object.entries(teamVotes).map(([answer, count]) => (
                        <div key={answer} className="glass-panel-solid p-3 text-center">
                          <p className="font-medium">{answer}</p>
                          <p className="text-2xl font-bold text-red-400">{count} votes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {phase === 'reveal' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <h2 className="text-3xl font-bold mb-4">Correct Answer</h2>
                    <p className="text-4xl font-bold text-green-400 mb-6">{questionData.correct}</p>
                    <div className="flex gap-8 mb-8">
                      <div className="text-center">
                        <p className="text-red-400 font-bold">Red Team</p>
                        <p className="text-2xl">+100</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-400 font-bold">Blue Team</p>
                        <p className="text-2xl text-muted-foreground">+0</p>
                      </div>
                    </div>
                    <Button onClick={nextRound} size="lg">Next Round</Button>
                  </div>
                )}
              </div>

              {/* Progress */}
              <Progress value={(currentRound / 10) * 100} className="h-2" />
            </div>

            {/* Right Sidebar - Team Chat */}
            <aside className="hidden lg:flex w-72 flex-col glass-panel overflow-hidden order-3">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                  <span className="font-bold">Team Chat</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTeamChat(!showTeamChat)}
                >
                  {showTeamChat ? 'All' : 'Team'}
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      Discuss with your team!
                    </p>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-bold",
                            msg.team === 'red' ? 'text-red-400' : 'text-blue-400'
                          )}>
                            {msg.player}
                          </span>
                        </div>
                        <p className="text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button size="icon" onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
