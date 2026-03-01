import { useState, useRef, useEffect } from "react";
import { useChatMessages, useCreateChatMessage } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

export default function Chat() {
  const { data: messages, isLoading } = useChatMessages();
  const createMessage = useCreateChatMessage();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMessage.mutate(
      { content },
      { onSuccess: () => setContent("") }
    );
  };

  // Sort ascending for chat flow
  const sortedMessages = [...(messages || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <h2 className="font-display font-bold text-lg">Family Chat</h2>
        <p className="text-xs text-muted-foreground">Keep everyone in the loop</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Loading messages...</div>
        ) : sortedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-4xl mb-2">👋</span>
            <p>Say hello to start the conversation!</p>
          </div>
        ) : (
          sortedMessages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const showHeader = idx === 0 || sortedMessages[idx-1].senderId !== msg.senderId;
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showHeader && (
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-6 h-6 border border-border/50">
                      <AvatarImage src={msg.user?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {msg.user?.firstName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-muted-foreground">
                      {isMe ? 'You' : msg.user?.firstName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                )}
                <div 
                  className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                      : 'bg-muted border border-border/50 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-background border-t border-border/50">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-1 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary/20 h-12"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || createMessage.isPending}
            className="rounded-xl h-12 w-12 shrink-0 bg-primary hover:bg-primary/90 shadow-md transition-transform active:scale-95"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
