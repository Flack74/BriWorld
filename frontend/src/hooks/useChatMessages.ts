import { useMemo, useState, useEffect } from 'react';
import AudioManager from '@/lib/audioManager';

interface UseChatMessagesProps {
  messages: any[];
  username: string;
  gameState: any;
  roomUpdate: any;
  playerAvatars: Record<string, string>;
}

export const useChatMessages = ({
  messages,
  username,
  gameState,
  roomUpdate,
  playerAvatars,
}: UseChatMessagesProps) => {
  const [notifiedMessages, setNotifiedMessages] = useState<Set<string>>(new Set());

  // Check for new @mentions and play notification
  useEffect(() => {
    if (!messages) return;
    
    messages.forEach(msg => {
      if (
        !notifiedMessages.has(msg.id) &&
        msg.content.includes(`@${username}`) &&
        msg.sender !== username
      ) {
        AudioManager.getInstance().playNotification();
        setNotifiedMessages(prev => new Set(prev).add(msg.id));
      }
    });
  }, [messages, username, notifiedMessages]);

  // Transform messages for GameChat
  const chatMessages = useMemo(() => {
    return messages.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.content,
      color: (msg.sender === username ? 'correct' : 'opponent') as 'correct' | 'opponent',
      timestamp: msg.timestamp,
      playerColor: gameState?.player_colors?.[msg.sender] || roomUpdate?.player_colors?.[msg.sender],
      avatarUrl: playerAvatars[msg.sender],
      reactions: msg.reactions,
    }));
  }, [messages, username, gameState, roomUpdate, playerAvatars]);

  return chatMessages;
};
