import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  color: "correct" | "opponent";
  timestamp?: Date;
  playerColor?: string;
  avatarUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> array of usernames
}

interface GameChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const GameChat = ({ messages, onSendMessage }: GameChatProps) => {
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMessage, setReactingToMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Rate limiting state
  const [messageTimes, setMessageTimes] = useState<number[]>([]);
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [muteEndTime, setMuteEndTime] = useState<number | null>(null);
  const [spamStartTime, setSpamStartTime] = useState<number | null>(null);
  
  const handleReaction = (messageId: string, emoji: string) => {
    // Send reaction via WebSocket
    onSendMessage(`REACTION:${messageId}:${emoji}`);
    setReactingToMessage(null);
  };
  // Update mute timer display
  useEffect(() => {
    if (isChatMuted && muteEndTime) {
      const interval = setInterval(() => {
        if (Date.now() >= muteEndTime) {
          setIsChatMuted(false);
          setMuteEndTime(null);
          setSpamStartTime(null);
          setMessageTimes([]);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isChatMuted, muteEndTime]);
  
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInput(input + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  
  const onReactionEmojiClick = (messageId: string, emojiData: EmojiClickData) => {
    handleReaction(messageId, emojiData.emoji);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const now = Date.now();
    
    // Check if user is muted
    if (isChatMuted && muteEndTime && now < muteEndTime) {
      return;
    } else if (isChatMuted && muteEndTime && now >= muteEndTime) {
      // Unmute user
      setIsChatMuted(false);
      setMuteEndTime(null);
      setSpamStartTime(null);
      setMessageTimes([]);
    }
    
    // Rate limiting: max 8 messages per 10 seconds
    const recentMessages = messageTimes.filter(time => now - time < 10000);
    
    if (recentMessages.length >= 8) {
      // Show spam warning
      setShowSpamWarning(true);
      setTimeout(() => setShowSpamWarning(false), 3000);
      
      // Track spam start time
      if (!spamStartTime) {
        setSpamStartTime(now);
      } else if (now - spamStartTime > 120000) { // 2 minutes of spamming
        // Mute for 5 minutes
        setIsChatMuted(true);
        setMuteEndTime(now + 300000); // 5 minutes
        setSpamStartTime(null);
        setMessageTimes([]);
      }
      return;
    }
    
    // Reset spam tracking if user behaves
    if (spamStartTime && recentMessages.length < 5) {
      setSpamStartTime(null);
    }
    
    // Send message and update rate limiting
    onSendMessage(input);
    setInput("");
    setMessageTimes(prev => [...prev.filter(time => now - time < 10000), now]);
  };

  return (
    <div className="card-elevated h-full flex flex-col overflow-hidden lg:relative">
      {/* Header - Hidden on mobile to save space */}
      <div className="hidden lg:flex p-2 sm:p-3 lg:p-5 items-center gap-1 sm:gap-2 lg:gap-3 border-b border-border/50">
        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary">
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground">Game Chat</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden lg:block">Chat with players</p>
        </div>
      </div>

      {/* Messages - Mobile: full height with bottom padding, Desktop: normal */}
      <div className="flex-1 overflow-y-auto lg:p-2 lg:space-y-1 p-1 space-y-0.5 pb-20 lg:pb-0">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className="animate-fade-in group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-0.5 sm:gap-1 lg:gap-2 hover:bg-muted/30 p-0.5 sm:p-1 lg:p-2 rounded-sm sm:rounded-md lg:rounded-lg transition-colors relative">
              {msg.avatarUrl ? (
                <img 
                  src={msg.avatarUrl}
                  alt={msg.sender}
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full shrink-0 mt-0.5 object-cover"
                  style={{ backgroundColor: msg.playerColor || '#6b7280' }}
                />
              ) : (
                <div 
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.playerColor || '#6b7280' }}
                >
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`font-semibold text-[10px] sm:text-xs lg:text-sm mr-0.5 sm:mr-1 lg:mr-2 ${
                    msg.color === "correct" ? "text-foreground" : ""
                  }`}
                  style={{ color: msg.color === "correct" ? undefined : (msg.playerColor || "#fbbf24") }}
                >
                  {msg.sender}
                </span>
                <span className="text-[10px] sm:text-xs lg:text-sm text-foreground break-words">{msg.text}</span>
              </div>
              <button
                onClick={() => setReactingToMessage(reactingToMessage === msg.id ? null : msg.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5 sm:p-1 rounded hidden lg:block"
              >
                <Smile className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
            
            {/* Emoji Picker for Reactions */}
            {reactingToMessage === msg.id && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]">
                <EmojiPicker
                  onEmojiClick={(emojiData) => onReactionEmojiClick(msg.id, emojiData)}
                  width={450}
                  height={400}
                />
              </div>
            )}
            
            {/* Reactions Display */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="ml-8 mt-1 flex flex-wrap gap-1">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => onSendMessage(`REACTION:${msg.id}:${emoji}`)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs transition-colors group relative"
                  >
                    <span>{emoji}</span>
                    <span className="text-muted-foreground">{users.length}</span>
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap z-50">
                      {users.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom on mobile, normal on desktop */}
      <form onSubmit={handleSubmit} className="lg:relative lg:p-2 lg:border-t lg:border-border/50 lg:bg-muted/30 fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur border-t border-border/50 z-[100] lg:z-auto safe-area-inset-bottom">
        <div className="flex gap-0.5 sm:gap-1 lg:gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isChatMuted ? "Chat muted..." : "Message..."}
              className="pr-8 sm:pr-10 lg:pr-12 bg-card border-border/50 focus-visible:ring-primary/50 text-[9px] sm:text-xs lg:text-sm h-5 sm:h-6 lg:h-8"
              disabled={isChatMuted}
            />
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-1 sm:right-2 lg:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <Smile className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
            </button>
            {showEmojiPicker && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={300}
                />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="shrink-0 gradient-primary shadow-glow-primary btn-primary-glow h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8"
            disabled={isChatMuted}
          >
            <Send className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
          </Button>
        </div>
      </form>
      
      {/* Spam Warning Banner */}
      {showSpamWarning && (
        <div className="absolute bottom-full left-0 right-0 mb-1 animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-lg shadow-lg border border-orange-300">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-sm">⚠️</span>
              <div className="text-center">
                <div className="text-xs font-bold">Slow down mate, are you okay?</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Mute Banner */}
      {isChatMuted && muteEndTime && (
        <div className="absolute bottom-full left-0 right-0 mb-1">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 rounded-lg shadow-lg border border-red-400">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-sm">🔇</span>
              <div className="text-center">
                <div className="text-xs font-bold">Chat muted for {Math.ceil((muteEndTime - Date.now()) / 60000)} min</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameChat;
