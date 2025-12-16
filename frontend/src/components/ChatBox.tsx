import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export const ChatBox = ({ messages, onSendMessage }: ChatBoxProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="glass-card-strong rounded-2xl overflow-hidden flex flex-col h-40">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Game Chat</span>
        <span className="text-xs text-muted-foreground ml-auto">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No messages yet...</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className="font-medium text-primary">{msg.sender}:</span>
              <span className="ml-1 text-foreground">{msg.content}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-card/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 h-10 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
        />
        <Button type="submit" size="icon" variant="game" className="h-10 w-10 rounded-xl">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
