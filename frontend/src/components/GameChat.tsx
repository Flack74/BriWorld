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
  
  const handleReaction = (messageId: string, emoji: string) => {
    // Send reaction via WebSocket
    onSendMessage(`REACTION:${messageId}:${emoji}`);
    setReactingToMessage(null);
  };
  
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
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="card-elevated h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center gap-3 border-b border-border/50">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Game Chat</h2>
          <p className="text-xs text-muted-foreground">Chat with players</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className="animate-fade-in group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-2 hover:bg-muted/30 p-2 rounded-lg transition-colors relative">
              {msg.avatarUrl ? (
                <img 
                  src={msg.avatarUrl}
                  alt={msg.sender}
                  className="w-6 h-6 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.playerColor || '#6b7280' }}
                />
              ) : (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.playerColor || '#6b7280' }}
                >
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`font-semibold text-sm mr-2 ${
                    msg.color === "correct" ? "text-foreground" : ""
                  }`}
                  style={{ color: msg.color === "correct" ? undefined : (msg.playerColor || "#fbbf24") }}
                >
                  {msg.sender}
                </span>
                <span className="text-sm text-foreground break-words">{msg.text}</span>
              </div>
              <button
                onClick={() => setReactingToMessage(reactingToMessage === msg.id ? null : msg.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <Smile className="w-4 h-4" />
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message..."
              className="pr-10 bg-card border-border/50 focus-visible:ring-primary/50"
            />
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={450}
                  height={400}
                />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="shrink-0 gradient-primary shadow-glow-primary btn-primary-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GameChat;
