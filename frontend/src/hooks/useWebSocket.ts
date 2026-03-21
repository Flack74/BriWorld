import { useState, useEffect, useRef } from "react";
import {
  WebSocketMessage,
  GameState,
  GameStateSnapshot,
  RoomUpdate,
  ChatMessage,
  GameConfig,
} from "@/types/game";
import type { WebSocketOutgoingMessage } from "@/types/ws";

function buildWebSocketUrl(params: {
  roomCode: string;
  username: string;
  sessionId: string;
  gameMode: GameConfig["gameMode"];
  roomType: "SINGLE" | "PRIVATE" | "PUBLIC";
  rounds: number;
  timeout: number;
  token: string;
}): string {
  const explicitWsUrl = import.meta.env.VITE_WS_URL;
  const apiBase = import.meta.env.VITE_API_URL;

  let baseUrl: URL;

  if (explicitWsUrl) {
    baseUrl = new URL(explicitWsUrl, window.location.origin);
  } else if (apiBase) {
    const apiUrl = new URL(apiBase, window.location.origin);
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    apiUrl.pathname = "/ws";
    apiUrl.search = "";
    baseUrl = apiUrl;
  } else {
    const fallback = new URL(window.location.origin);
    fallback.protocol = fallback.protocol === "https:" ? "wss:" : "ws:";
    fallback.pathname = "/ws";
    baseUrl = fallback;
  }

  baseUrl.searchParams.set("room", params.roomCode);
  baseUrl.searchParams.set("username", params.username);
  baseUrl.searchParams.set("session", params.sessionId);
  baseUrl.searchParams.set("mode", params.gameMode);
  baseUrl.searchParams.set("type", params.roomType);
  baseUrl.searchParams.set("rounds", String(params.rounds));
  baseUrl.searchParams.set("timeout", String(params.timeout));
  baseUrl.searchParams.set("token", params.token);

  return baseUrl.toString();
}

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

  const applySnapshot = (snapshot: GameStateSnapshot) => {
    setGameState(snapshot as GameState);
    setRoomUpdate({
      players: snapshot.players || Object.keys(snapshot.scores || {}),
      current_count:
        snapshot.current_count ??
        snapshot.players?.length ??
        Object.keys(snapshot.scores || {}).length,
      status: snapshot.status,
      current_round: snapshot.current_round,
      owner: snapshot.owner,
      game_mode: snapshot.game_mode,
      map_mode: snapshot.map_mode,
      player_colors: snapshot.player_colors,
      player_avatars: snapshot.player_avatars,
      player_banners: snapshot.player_banners,
      team_battle: snapshot.team_battle,
    });
  };

  const roomCode = props?.roomCode;
  const username = props?.username;
  const gameMode = props?.gameMode;
  const roomType = props?.roomType;
  const rounds = props?.rounds ?? 10;
  const timeout = props?.timeout ?? 15;

  useEffect(() => {
    if (!roomCode || !username || !gameMode || !roomType) return;

    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem("sessionId", sessionId);
    }

    const token = localStorage.getItem("token") || "";
    const wsUrl = buildWebSocketUrl({
      roomCode,
      username,
      sessionId,
      gameMode,
      roomType,
      rounds,
      timeout,
      token,
    });

    let websocket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.onopen = () => {
        reconnectAttempts = 0;
        setIsConnected(true);
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
          // 🔥 CRITICAL: Handle authoritative snapshot (fixes desync & blank UI)
          case "state_snapshot": {
            applySnapshot(message.payload as GameStateSnapshot);
            break;
          }

          // 🖼️ Wait for images before starting timer (fixes flag/silhouette delay)
          case "round_started": {
            const roundState = message.payload as GameStateSnapshot;
            const flagCode = roundState.question?.flag_code;

            if (flagCode) {
              const img = new Image();
              img.src = `/flags/${flagCode}.png`;
              img.onload = () => {
                applySnapshot(roundState);
              };
              img.onerror = () => {
                applySnapshot(roundState);
              };
            } else {
              applySnapshot(roundState);
            }
            break;
          }

          case "game_started":
            applySnapshot(message.payload as GameStateSnapshot);
            break;

          case "start_game_error":
            alert(message.payload.error || "Cannot start game");
            break;

          // Handle initial connection confirmation
          case "connected":
            break;

          // Handle flat room_update from backend
          case "room_update": {
            const updatePayload = message.payload as RoomUpdate;
            setRoomUpdate(updatePayload);
            setGameState((prev) =>
              prev
                ? {
                    ...prev,
                    status: updatePayload.status ?? prev.status,
                    current_round:
                      updatePayload.current_round ?? prev.current_round,
                    game_mode: updatePayload.game_mode ?? prev.game_mode,
                    room_type:
                      updatePayload.room_type ?? prev.room_type,
                    map_play_mode:
                      (updatePayload.map_mode as GameState["map_play_mode"]) ??
                      prev.map_play_mode,
                    player_colors:
                      updatePayload.player_colors ?? prev.player_colors,
                    player_banners:
                      updatePayload.player_banners ?? prev.player_banners,
                    scores: updatePayload.scores ?? prev.scores,
                  }
                : prev,
            );
            break;
          }

          // Handle room_joined — flat payload with full room state
          case "room_joined": {
            applySnapshot(message.payload as GameStateSnapshot);
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

            setMessages((prev) => [...prev, chatMsg]);
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
          // Ignore parsing errors
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
        setWs((current) => (current === websocket ? null : current));
        if (wsRef.current === websocket) {
          wsRef.current = null;
        }

        if (cancelled) {
          return;
        }

        reconnectAttempts += 1;
        const delay = Math.min(1000 * reconnectAttempts, 5000);
        reconnectTimer = setTimeout(connect, delay);
      };

      websocket.onerror = () => {
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (
        websocket &&
        (websocket.readyState === WebSocket.OPEN ||
          websocket.readyState === WebSocket.CONNECTING)
      ) {
        websocket.close();
      }
    };
  }, [roomCode, username, gameMode, roomType, rounds, timeout]);

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
      type: "set_color",
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
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      // console.warn('[WebSocket] Cannot paint - connection not open:', wsRef.current?.readyState);
      return;
    }
    // console.log('[WebSocket] Sending paint_country:', countryCode);
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
