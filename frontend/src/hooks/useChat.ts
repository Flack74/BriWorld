import { useCallback, useEffect } from 'react';

interface ChatMessage {
  id: string;
  player_name: string;
  message: string;
  timestamp: number;
  reactions?: Record<string, string[]>;
}

interface UseChatProps {
  ws: WebSocket | null;
  onMessageReceived: (message: ChatMessage) => void;
  onReactionReceived: (messageId: string, emoji: string, username: string) => void;
}

export function useChat({ ws, onMessageReceived, onReactionReceived }: UseChatProps) {
  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'chat_message',
      payload: { message }
    }));
  }, [ws]);

  // Send reaction
  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Format: REACTION:messageId:emoji
    const reactionMessage = `REACTION:${messageId}:${emoji}`;
    ws.send(JSON.stringify({
      type: 'chat_message',
      payload: { message: reactionMessage }
    }));
  }, [ws]);

  // Listen for chat messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'chat_message') {
          const msg: ChatMessage = {
            id: data.payload.id,
            player_name: data.payload.player_name,
            message: data.payload.message,
            timestamp: data.payload.timestamp,
            reactions: {}
          };
          onMessageReceived(msg);
        }

        if (data.type === 'message_reaction') {
          onReactionReceived(
            data.payload.message_id,
            data.payload.emoji,
            data.payload.username
          );
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, onMessageReceived, onReactionReceived]);

  return { sendMessage, sendReaction };
}
