import { useState, useEffect, useRef } from 'react';
import { WebSocketMessage, GameState, RoomUpdate, ChatMessage } from '@/types/game';

interface UseWebSocketProps {
  roomCode: string;
  username: string;
  gameMode: 'FLAG' | 'WORLD_MAP';
  roomType: 'SINGLE' | 'PRIVATE' | 'PUBLIC';
  rounds?: number;
  timeout?: number;
}

interface WebSocketHookReturn {
  ws: WebSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  roomUpdate: RoomUpdate | null;
  messages: ChatMessage[];
  sendMessage: (message: WebSocketMessage) => void;
  sendAnswer: (answer: string, responseTime: number) => void;
  sendChatMessage: (message: string) => void;
  startGame: () => void;
  selectColor: (color: string) => void;
  setMapMode: (mode: 'FREE') => void;
}

export const useWebSocket = ({
  roomCode,
  username,
  gameMode,
  roomType,
  rounds = 10,
  timeout = 15
}: UseWebSocketProps): WebSocketHookReturn => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomUpdate, setRoomUpdate] = useState<RoomUpdate | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = localStorage.getItem('token') || '';
    const wsUrl = `${protocol}//${host}/ws?room=${encodeURIComponent(roomCode)}&username=${encodeURIComponent(username)}&session=${encodeURIComponent(sessionId)}&mode=${gameMode}&type=${roomType}&rounds=${rounds}&timeout=${timeout}&token=${encodeURIComponent(token)}`;
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'round_started':
          case 'game_started':
            const gameStatePayload = message.payload as GameState;
            setGameState(gameStatePayload);
            break;
          case 'room_update':
            setRoomUpdate(message.payload as RoomUpdate);
            break;
          case 'timer_update':
            // Only update timer for FLAG mode
            setGameState(prev => {
              if (!prev || prev.game_mode !== 'FLAG') return prev;
              return { 
                ...prev, 
                time_remaining: message.payload.time_remaining,
                deadline: message.payload.deadline || prev.deadline
              };
            });
            break;
          case 'answer_submitted':
            // Handle in Game component
            break;
          case 'score_update':
            setGameState(prev => {
              if (!prev) {
                return { scores: message.payload.scores, player_colors: {} } as GameState;
              }
              return { ...prev, scores: message.payload.scores };
            });
            break;
          case 'game_completed':
            setGameState(message.payload as GameState);
            break;
          case 'country_painted':
            setGameState(prev => prev ? { 
              ...prev, 
              painted_countries: message.payload.painted_countries,
              player_colors: message.payload.player_colors || prev.player_colors
            } : null);
            break;
          case 'chat_message':
            const msgTimestamp = message.payload.timestamp ? new Date(message.payload.timestamp).getTime() : Date.now();
            const chatMsg: ChatMessage = {
              id: msgTimestamp.toString(),
              sender: message.payload.player_name,
              content: message.payload.message,
              timestamp: new Date(msgTimestamp),
              isSystem: false
            };
            setMessages(prev => [chatMsg, ...prev]);
            break;
          case 'message_reaction':
            setMessages(prev => {
              const updated = prev.map(msg => {
                if (msg.id === message.payload.message_id) {
                  const reactions = { ...msg.reactions } || {};
                  const emoji = message.payload.emoji;
                  const username = message.payload.username;
                  const users = reactions[emoji] || [];
                  
                  // Toggle reaction - remove if already exists, add if not
                  const userIndex = users.indexOf(username);
                  if (userIndex > -1) {
                    users.splice(userIndex, 1);
                    if (users.length === 0) {
                      delete reactions[emoji];
                    } else {
                      reactions[emoji] = users;
                    }
                  } else {
                    reactions[emoji] = [...users, username];
                  }
                  
                  return { ...msg, reactions };
                }
                return msg;
              });
              return updated;
            });
            break;
          case 'session_collision':
            // Handle collision - show dialog
            window.dispatchEvent(new CustomEvent('session_collision', { detail: message.payload }));
            break;
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
    };

    websocket.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const sendAnswer = (answer: string, responseTime: number) => {
    sendMessage({
      type: 'submit_answer',
      payload: { answer, response_time_ms: responseTime }
    });
  };

  const sendChatMessage = (message: string) => {
    sendMessage({
      type: 'chat_message',
      payload: { message }
    });
  };

  const startGame = () => {
    sendMessage({ type: 'start_game' });
  };

  const selectColor = (color: string) => {
    sendMessage({
      type: 'color_selected',
      payload: { color }
    });
  };

  const setMapMode = (mode: 'FREE') => {
    sendMessage({
      type: 'set_map_mode',
      payload: { map_play_mode: mode }
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
    setMapMode
  };
};

// Generate a unique session ID
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}