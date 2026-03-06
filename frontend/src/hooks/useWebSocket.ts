import { useState, useEffect, useRef } from "react";
import {
  WebSocketMessage,
  GameState,
  RoomUpdate,
  ChatMessage,
  GameConfig,
} from "@/types/game";
import type { WebSocketOutgoingMessage } from "@/types/ws";

interface UseWebSocketProps {
  roomCode: string;
  username: string;
  gameMode: GameConfig["gameMode"];
  roomType: "SINGLE" | "PRIVATE" | "PUBLIC";
  rounds?: number;
  timeout?: number;
}

interface WebSocketHookReturn {
  ws: WebSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  roomUpdate: RoomUpdate | null;
  messages: ChatMessage[];
  sendMessage: (message: WebSocketOutgoingMessage) => void;
  sendAnswer: (answer: string, responseTime: number) => void;
  sendChatMessage: (message: string) => void;
  startGame: () => void;
  selectColor: (color: string) => void;
  setMapMode: (mode: "FREE") => void;
  switchTeam: (team: "RED" | "BLUE") => void;
  sendPaintCountry: (countryCode: string) => void;
}

export const useWebSocket = (
  props: UseWebSocketProps | null
): WebSocketHookReturn => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomUpdate, setRoomUpdate] = useState<RoomUpdate | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const roomCode = props?.roomCode;
  const username = props?.username;
  const gameMode = props?.gameMode;
  const roomType = props?.roomType;
  const rounds = props?.rounds ?? 10;
  const timeout = props?.timeout ?? 15;

  useEffect(() => {
    if (!roomCode || !username || !gameMode || !roomType) return;

    // 🔒 Prevent duplicate socket connections (CRITICAL FIX)
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem("sessionId", sessionId);
    }

    console.log("[WS DEBUG] Connecting:", {
      roomCode,
      gameMode,
      roomType,
      username,
    });

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const token = localStorage.getItem("token") || "";

    const wsUrl = `${protocol}//${host}/ws?room=${encodeURIComponent(
      roomCode,
    )}&username=${encodeURIComponent(username)}&session=${encodeURIComponent(
      sessionId,
    )}&mode=${gameMode}&type=${roomType}&rounds=${rounds}&timeout=${timeout}&token=${encodeURIComponent(
      token,
    )}`;

    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("[WS] Connected");
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('[WS] Received message:', message.type, message.payload);

        switch (message.type) {
          // 🔥 CRITICAL: Handle authoritative snapshot (fixes desync & blank UI)
          case "state_snapshot": {
            const snapshot = message.payload as GameState;
            setGameState(snapshot);

            setRoomUpdate({
              players: Object.keys(snapshot.scores || {}),
              current_count: Object.keys(snapshot.scores || {}).length,
              status: snapshot.status,
              current_round: snapshot.current_round,
              owner: (snapshot as unknown as { owner?: string }).owner,
              game_mode: snapshot.game_mode,
              map_mode: (snapshot as unknown as { map_play_mode?: string })
                .map_play_mode,
              player_colors: snapshot.player_colors,
              player_avatars: undefined,
              team_battle: snapshot.team_battle,
            });
            break;
          }

          // 🖼️ Wait for images before starting timer (fixes flag/silhouette delay)
          case "round_started": {
            const roundState = message.payload as GameState;

            const imageSrc =
              roundState.question?.silhouette ||
              (roundState.question?.flag_code
                ? `/flags/${roundState.question.flag_code}.png`
                : null);

            if (imageSrc) {
              const img = new Image();
              img.src = imageSrc;
              img.onload = () => {
                setGameState(roundState);
              };
              img.onerror = () => {
                setGameState(roundState);
              };
            } else {
              setGameState(roundState);
            }
            break;
          }

          case "game_started":
            setGameState(message.payload as GameState);
            break;

          // Handle initial connection confirmation
          case "connected": {
            const connPayload = message.payload as {
              is_owner?: boolean;
              room_id?: string;
              username?: string;
            };
            console.log('[WS] Connected to room:', connPayload.room_id);
            break;
          }

          // Handle flat room_update from backend
          case "room_update": {
            const updatePayload = message.payload as RoomUpdate;
            setRoomUpdate(updatePayload);
            break;
          }

          // Handle room_joined — flat payload with full room state
          case "room_joined": {
            const payload = message.payload as {
              players?: string[];
              owner?: string;
              current_count?: number;
              status?: string;
              game_mode?: string;
              room_type?: string;
              map_mode?: string;
              player_colors?: Record<string, string>;
              player_avatars?: Record<string, string>;
              scores?: Record<string, number>;
              is_owner?: boolean;
              team_battle?: any;
              current_round?: number;
            };

            setRoomUpdate({
              players: payload.players || [username || ''],
              current_count: payload.current_count || payload.players?.length || 1,
              status: (payload.status as GameState['status']) || 'waiting',
              current_round: payload.current_round || 0,
              owner: payload.owner || username,
              game_mode: payload.game_mode as GameState['game_mode'],
              map_mode: payload.map_mode,
              player_colors: payload.player_colors,
              player_avatars: payload.player_avatars,
              team_battle: payload.team_battle,
            });

            // Also set initial game state if not yet set
            setGameState((prev) => prev ?? {
              status: (payload.status as GameState['status']) || 'waiting',
              current_round: payload.current_round || 0,
              total_rounds: 10,
              scores: payload.scores || {},
              time_remaining: 0,
              game_mode: payload.game_mode as GameState['game_mode'],
              room_type: (payload.room_type as GameState['room_type']) || 'SINGLE',
              player_colors: payload.player_colors,
            } as GameState);
            break;
          }

          case "timer_update":
            setGameState((prev) =>
              prev
                ? {
                  ...prev,
                  time_remaining: message.payload.time_remaining,
                  deadline: message.payload.deadline ?? prev.deadline,
                }
                : prev,
            );
            break;

          case "score_update":
            setGameState((prev) =>
              prev ? { ...prev, scores: message.payload.scores } : prev,
            );
            break;

          case "country_painted":
            setGameState((prev) =>
              prev ? {
                ...prev,
                painted_countries: message.payload.painted_countries,
                player_colors: message.payload.player_colors,
                scores: message.payload.scores,
              } : prev,
            );
            break;

          case "game_completed": {
            const finalState = message.payload as GameState;

            // ✅ Correct missed calculation for Last Standing (single + multiplayer)
            if (finalState.game_mode === "LAST_STANDING") {
              const total = finalState.total_rounds;
              const correct = Object.values(finalState.answered || {}).filter(
                Boolean,
              ).length;
              const missed = total - correct;

              (finalState as unknown as { final_stats?: unknown }).final_stats =
              {
                correct,
                missed,
                total,
              };
            }

            setGameState(finalState);
            break;
          }

          case "chat_message": {
            const timestamp = message.payload.timestamp
              ? new Date(message.payload.timestamp).getTime()
              : Date.now();

            const chatMsg: ChatMessage = {
              id: `${message.payload.player_name}-${timestamp}`,
              sender: message.payload.player_name,
              content: message.payload.message,
              timestamp: new Date(timestamp),
              isSystem: false,
            };

            setMessages((prev) => [chatMsg, ...prev]);
            break;
          }

          case "message_reaction": {
            const reactionPayload = message.payload as {
              message_id: string;
              reactions: Record<string, string[]>;
              username: string;
            };

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === reactionPayload.message_id
                  ? { ...msg, reactions: reactionPayload.reactions }
                  : msg,
              ),
            );
            break;
          }

          case "session_collision":
            window.dispatchEvent(
              new CustomEvent("session_collision", {
                detail: message.payload,
              }),
            );
            break;

          case "redirect_spectator":
            window.dispatchEvent(
              new CustomEvent("redirect_spectator", {
                detail: message.payload,
              }),
            );
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
      }
    };

    websocket.onclose = (event) => {
      console.log("[WS] Connection closed:", event.code, event.reason);
      setIsConnected(false);
      setWs(null);
      wsRef.current = null;
    };

    websocket.onerror = (error) => {
      console.error("[WS] Error:", error);
      setIsConnected(false);
    };

    return () => {
      if (
        websocket.readyState === WebSocket.OPEN ||
        websocket.readyState === WebSocket.CONNECTING
      ) {
        websocket.close();
      }
    };
  }, [roomCode, username]); // 🔥 STABLE deps (fixes desync & reconnect loops)

  const sendMessage = (message: WebSocketOutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const sendAnswer = (answer: string, responseTime: number) => {
    sendMessage({
      type: "submit_answer",
      payload: { answer, response_time_ms: responseTime },
    });
  };

  const sendChatMessage = (message: string) => {
    sendMessage({
      type: "chat_message",
      payload: { message },
    });
  };

  const startGame = () => {
    sendMessage({ type: "start_game" });
  };

  const selectColor = (color: string) => {
    sendMessage({
      type: "color_selected",
      payload: { color },
    });
  };

  const setMapMode = (mode: "FREE") => {
    sendMessage({
      type: "set_map_mode",
      payload: { mode },
    });
  };

  const switchTeam = (team: string) => {
    sendMessage({
      type: "switch_team",
      payload: { team },
    });
  };

  const sendPaintCountry = (countryCode: string) => {
    sendMessage({
      type: "paint_country",
      payload: { country_code: countryCode },
    });
  };

  return {
    ws,
    isConnected,
    gameState,
    roomUpdate,
    messages,
    sendMessage,
    sendAnswer,
    sendChatMessage,
    startGame,
    selectColor,
    setMapMode,
    switchTeam,
    sendPaintCountry,
  };
};

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
