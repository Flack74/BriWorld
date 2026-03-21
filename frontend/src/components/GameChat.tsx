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
  players?: string[]; // Add players list for mentions
}

const GameChat = ({ messages, onSendMessage, players = [] }: GameChatProps) => {
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMessage, setReactingToMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Filter players for mention autocomplete
  const filteredPlayers = players.filter(player => 
    player.toLowerCase().startsWith(mentionSearch.toLowerCase())
  );
  
  // Handle input change with mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setInput(value);
    
    // Check for @ mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show mentions if @ is at start or after space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setSelectedMentionIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
  };
  
  // Handle mention selection
  const selectMention = (username: string) => {
    const before = input.slice(0, mentionStartPos);
    const after = input.slice(mentionStartPos + mentionSearch.length + 1);
    const newValue = before + '@' + username + ' ' + after;
    setInput(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  };
  
  // Handle keyboard navigation in mention list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || filteredPlayers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < filteredPlayers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredPlayers.length - 1
      );
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      selectMention(filteredPlayers[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
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

  const renderAvatar = (msg: Message) => {
    if (msg.avatarUrl) {
      return (
        <img
          src={msg.avatarUrl}
          alt={msg.sender}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
          style={{ backgroundColor: msg.playerColor || "#6b7280" }}
        />
      );
    }

    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: msg.playerColor || "#6b7280" }}
      >
        {msg.sender.charAt(0).toUpperCase()}
      </div>
    );
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

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className="animate-fade-in group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative flex items-start gap-2 rounded-xl p-2 transition-colors hover:bg-muted/30">
              {renderAvatar(msg)}
              <div className="min-w-0 flex flex-1 items-start gap-2">
                <span
                  className="shrink-0 pt-0.5 text-sm font-semibold"
                  style={{ color: msg.color === "correct" ? undefined : (msg.playerColor || "#fbbf24") }}
                >
                  {msg.sender}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-foreground">
                  <p className="break-words leading-relaxed">{msg.text}</p>
                </div>
              </div>

              {/* Reaction button */}
              <button
                type="button"
                onClick={() => setReactingToMessage(reactingToMessage === msg.id ? null : msg.id)}
                className="mt-1 shrink-0 opacity-0 transition-opacity text-muted-foreground hover:text-foreground text-xs group-hover:opacity-100"
              >
                <Smile className="w-3 h-3" />
              </button>
            </div>
            
            {/* Reaction Picker */}
            {reactingToMessage === msg.id && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setReactingToMessage(null)}>
                <div className="bg-popover border border-border rounded-lg shadow-xl overflow-visible" onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => onReactionEmojiClick(msg.id, emojiData)}
                    width={Math.min(300, window.innerWidth - 32)}
                    height={Math.min(400, window.innerHeight - 100)}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              </div>
            )}
            
            {/* Display Reactions */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="ml-10 mt-1 flex flex-wrap gap-1">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 hover:bg-muted rounded text-xs"
                    onClick={() => handleReaction(msg.id, emoji)}
                  >
                    <span>{emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{users.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border/50 bg-muted/30 p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isChatMuted ? "Chat muted..." : "Message..."}
              className="h-10 bg-card border-border/50 pr-12 text-sm focus-visible:ring-primary/50"
              disabled={isChatMuted}
            />
            
            {/* Mention Autocomplete Dropdown */}
            {showMentions && filteredPlayers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full max-w-[200px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-[200]">
                {filteredPlayers.map((player, index) => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => selectMention(player)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                      index === selectedMentionIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {player.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-foreground">{player}</span>
                  </button>
                ))}
              </div>
            )}
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </button>
            {showEmojiPicker && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEmojiPicker(false)}>
                <div className="bg-popover border border-border rounded-lg shadow-xl overflow-visible" onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={Math.min(320, window.innerWidth - 32)}
                    height={Math.min(450, window.innerHeight - 100)}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 shrink-0 gradient-primary shadow-glow-primary btn-primary-glow"
            disabled={isChatMuted || !input.trim()}
          >
            <Send className="h-4 w-4" />
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
