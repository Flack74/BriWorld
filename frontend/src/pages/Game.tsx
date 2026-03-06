/**
 * Game.tsx — Refactored main gameplay page following React best practices.
 *
 * This component now delegates responsibilities to:
 * - Custom hooks for state management (useGameState, useBanners, usePlayers, etc.)
 * - Layout components (WorldMapLayout, QuizModeLayout)
 * - Reusable UI components (GameBanners, GameOverModal, CongratsModal)
 *
 * Benefits:
 * - Improved testability and maintainability
 * - Clear separation of concerns
 * - Reusable logic across components
 * - Reduced complexity and cognitive load
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGameState } from "@/hooks/useGameState";
import { useBanners } from "@/hooks/useBanners";
import { usePlayers } from "@/hooks/usePlayers";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import { useGameModals } from "@/hooks/useGameModals";
import { useColorManagement } from "@/hooks/useColorManagement";
import { useGameAutoStart } from "@/hooks/useGameAutoStart";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ColorPickerModal } from "@/components/ColorPickerModal";
import { CollisionDialog } from "@/components/CollisionDialog";
import { ReconnectionDialog } from "@/components/ReconnectionDialog";
import { LeaveRoomDialog } from "@/components/LeaveRoomDialog";
import { SuccessBanner, ErrorBanner, TimeoutBanner, AlreadyGuessedBanner } from "@/components/GameBanners";
import { GameOverModal } from "@/components/GameOverModal";
import { CongratsModal } from "@/components/CongratsModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { WorldMapLayout } from "@/components/WorldMapLayout";
import { QuizModeLayout } from "@/components/QuizModeLayout";
import { GameConfig } from "@/types/game";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const config = location.state as GameConfig | null;

  // Guard: Redirect to lobby if config is missing
  if (!config) {
    sessionStorage.removeItem('currentRoomCode');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('roomType');
    sessionStorage.removeItem('rounds');
    sessionStorage.removeItem('mapMode');
    navigate('/lobby');
    return null;
  }

  // Persist config to sessionStorage
  sessionStorage.setItem('gameMode', config.gameMode);
  sessionStorage.setItem('roomType', config.roomType);
  sessionStorage.setItem('rounds', config.rounds?.toString() || '10');

  // Initialize audio manager
  useAudioManager();

  // Generate room code first
  const [roomCode] = useState(() => {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const newCode = config.roomCode || savedRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('currentRoomCode', newCode);
    return newCode;
  });

  const [isActualReconnect] = useState(() => {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    return !!savedRoomCode && savedRoomCode === config.roomCode;
  });

  // WebSocket connection
  const {
    ws,
    isConnected,
    gameState,
    roomUpdate,
    messages,
    sendAnswer,
    sendChatMessage,
    startGame,
    selectColor,
    setMapMode: setWSMapMode,
    sendPaintCountry
  } = useWebSocket({
    roomCode,
    username: config.username,
    gameMode: config.gameMode,
    roomType: config.roomType,
    rounds: config.rounds,
    timeout: config.timeout
  });

  // Room management with WebSocket
  const leaveRoom = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'close_room' }));
      ws.close();
    }
    sessionStorage.removeItem('currentRoomCode');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('roomType');
    sessionStorage.removeItem('rounds');
    sessionStorage.removeItem('mapMode');
    navigate('/lobby');
  };

  // Handle room closed or expired
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'room_closed' || message.type === 'room_expired') {
          leaveRoom();
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, navigate]);

  // Game state management
  const { startTime, gameStats, guessedCountries, hasGuessedThisRound, setStartTime } = useGameState({
    config,
    gameState,
    roomUpdate,
    ws
  });

  // Banner management
  const {
    showSuccessBanner,
    showTimeoutBanner,
    lastAnswer,
    timeoutCountry
  } = useBanners({ ws, username: config.username });

  // Player management
  const { players, playerAvatars } = usePlayers({
    gameState,
    roomUpdate,
    username: config.username
  });

  // Chat management
  const chatMessages = useChatMessages({
    messages,
    username: config.username,
    gameState,
    roomUpdate,
    playerAvatars
  });

  // UI state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat' | 'none'>('none');

  // Modal management
  const {
    showGameOver,
    setShowGameOver,
    showCongratsModal,
    setShowCongratsModal,
    isReconnecting,
    wasReconnected,
    setWasReconnected
  } = useGameModals({ ws, gameState, isActualReconnect, gameStats });

  // Color management (World Map mode)
  const { showColorModal, setShowColorModal, selectedColor, handleColorSelect } = useColorManagement({
    isConnected,
    gameMode: config.gameMode,
    roomUpdate,
    username: config.username,
    roomCode,
    selectColor
  });

  // Auto-start logic
  useGameAutoStart({
    isConnected,
    gameState,
    roomUpdate,
    gameMode: config.gameMode,
    roomType: config.roomType,
    username: config.username,
    startGame,
    setWSMapMode
  });

  const actualGameMode = gameState?.game_mode || roomUpdate?.game_mode || config.gameMode;

  // Handle game restart redirect
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'game_restarted') {
          if (config.roomType !== 'SINGLE') {
            navigate('/waiting', { state: { ...config, roomCode } });
          }
          return;
        }

        if (message.type === 'color_rejected') {
          setShowColorModal(true);
          return;
        }

        if (message.type === 'answer_submitted') {
          const answerData = message.payload;
          if (answerData.is_correct && answerData.player !== config.username) {
            toast({
              title: `${answerData.player} guessed ${answerData.country_name}! 🎉`,
              duration: 2000,
            });
          }
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, config, navigate, roomCode, toast, setShowColorModal]);

  // Handle spectator redirect
  useEffect(() => {
    const handleSpectatorRedirect = () => {
      navigate(`/spectate/${roomCode}`);
    };
    window.addEventListener('redirect_spectator', handleSpectatorRedirect as EventListener);
    return () => window.removeEventListener('redirect_spectator', handleSpectatorRedirect as EventListener);
  }, [navigate, roomCode]);

  // Handle answer submission
  const handleSubmitAnswer = (answer: string) => {
    if (actualGameMode === 'WORLD_MAP') {
      sendPaintCountry(answer);
    } else if (startTime) {
      sendAnswer(answer, Date.now() - startTime);
    } else {
      sendAnswer(answer, 0);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'restart_game' }));
    }
    setShowGameOver(false);
    setShowCongratsModal(false);
  };

  // Handle back to lobby
  const handleBackToLobby = () => {
    leaveRoom();
  };

  // Timeout fallback - if no response after 30 seconds, show error
  useEffect(() => {
    if (gameState || roomUpdate || !isConnected) return;

    const timer = setTimeout(() => {
      if (!gameState && !roomUpdate && isConnected) {
        toast({
          title: 'Connection Timeout',
          description: 'Server is taking too long to respond. Please try again.',
          variant: 'destructive',
        });
        navigate('/lobby');
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [gameState, roomUpdate, isConnected, toast, navigate]);

  // Show loading until we get server's game mode confirmation
  if (!gameState && !roomUpdate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  // Wait for server to confirm game mode before rendering
  if (!gameState?.game_mode && !roomUpdate?.game_mode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Waiting for room mode...</p>
        </div>
      </div>
    );
  }

  // World Map View (Only for WORLD_MAP)
  if (actualGameMode === 'WORLD_MAP') {
    return (
      <>
        <WorldMapLayout
          roomCode={roomCode}
          roomType={config.roomType}
          gameStats={gameStats}
          guessedCountries={guessedCountries}
          userColor={gameState?.player_colors?.[config.username] || selectedColor}
          paintedCountries={gameState?.painted_countries || {}}
          playerColors={gameState?.player_colors || {}}
          players={players}
          chatMessages={chatMessages}
          onLeave={() => setShowLeaveDialog(true)}
          onSubmitAnswer={handleSubmitAnswer}
          onSendMessage={sendChatMessage}
        />

        {/* Banners */}
        <SuccessBanner show={showSuccessBanner} country={lastAnswer?.country} />
        <TimeoutBanner show={showTimeoutBanner} country={timeoutCountry} />

        {/* Modals */}
        <ColorPickerModal
          open={showColorModal}
          onClose={() => setShowColorModal(false)}
          onSelectColor={handleColorSelect}
          selectedColor={selectedColor}
          takenColors={Object.values(roomUpdate?.player_colors || {})}
        />
        <CollisionDialog />
        <ReconnectionDialog
          isReconnecting={isReconnecting}
          onReconnected={() => setWasReconnected(true)}
        />
        <LeaveRoomDialog
          open={showLeaveDialog}
          onConfirm={leaveRoom}
          onCancel={() => setShowLeaveDialog(false)}
        />
        <GameOverModal
          show={showGameOver}
          gameStats={gameStats}
          totalRounds={config.rounds || 10}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
        <CongratsModal
          show={showCongratsModal}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      </>
    );
  }

  // Quiz Mode View (For FLAG, etc.)
  return (
    <>
      <QuizModeLayout
        roomCode={roomCode}
        roomType={config.roomType}
        gameState={gameState!}
        username={config.username}
        players={players}
        chatMessages={chatMessages}
        onLeave={() => setShowLeaveDialog(true)}
        onSubmitAnswer={handleSubmitAnswer}
        onSendMessage={sendChatMessage}
      />

      {/* Banners */}
      <SuccessBanner show={showSuccessBanner} country={lastAnswer?.country} />
      <TimeoutBanner show={showTimeoutBanner} country={timeoutCountry} />

      {/* Loading Spinner */}
      <LoadingSpinner show={!gameState?.question && isConnected} message="Loading next round..." />

      {/* Modals */}
      <GameOverModal
        show={showGameOver}
        gameStats={gameStats}
        totalRounds={config.rounds || 10}
        onPlayAgain={handlePlayAgain}
        onBackToLobby={handleBackToLobby}
      />
      <CongratsModal
        show={showCongratsModal}
        onPlayAgain={handlePlayAgain}
        onBackToLobby={handleBackToLobby}
      />
      <ColorPickerModal
        open={showColorModal}
        onClose={() => setShowColorModal(false)}
        onSelectColor={handleColorSelect}
        selectedColor={selectedColor}
        takenColors={Object.values(gameState?.player_colors || roomUpdate?.player_colors || {})}
      />
      <CollisionDialog />
      <ReconnectionDialog
        isReconnecting={isReconnecting}
        onReconnected={() => setWasReconnected(true)}
      />
      <LeaveRoomDialog
        open={showLeaveDialog}
        onConfirm={leaveRoom}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </>
  );
};

export default Game;
