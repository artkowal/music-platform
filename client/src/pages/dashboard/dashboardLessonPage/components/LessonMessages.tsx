import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { messagesApi } from "@/api/messages";
import type { Message } from "@/types/Message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, MoreVertical, Pencil, Trash2, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useSocket } from "@/context/SocketContext";

interface LessonMessagesProps {
  lessonId: number;
  accentColor: string;
  onClose?: () => void;
}

export function LessonMessages({ lessonId, accentColor, onClose }: LessonMessagesProps) {
  const { user } = useAuth();
  const { socket } = useSocket(); 
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const data = await messagesApi.getByLessonId(lessonId);
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Błąd pobierania wiadomości", error);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
        socket.off("receive_message", handleNewMessage);
    };
  }, [socket]);


  const handleAddMessage = async () => {
    if (!newMessage.trim() || !socket) return;
    
    setIsSending(true);

    try {
        socket.emit("send_message", {
            lessonId,
            content: newMessage
        });

        setNewMessage("");
    } catch (error) {
        console.error(error);
    } finally {
        setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddMessage();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;
    try {
      await messagesApi.delete(id);
      setMessages(prev => prev.map(m => m.message_id === id ? {...m, is_deleted: true} : m));
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (message: Message) => {
    setEditingId(message.message_id);
    setEditContent(message.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await messagesApi.update(editingId, editContent);
      setMessages(prev => prev.map(m => m.message_id === editingId ? {...m, content: editContent, updated_at: new Date().toISOString()} : m));
      setEditingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM, HH:mm", { locale: pl });
  };

  const getInitials = (first: string, last: string) => `${first[0]}${last[0]}`;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background border shadow-sm">
                <MessageSquare className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div>
                <h3 className="font-semibold text-sm">Strefa Dyskusji</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                    Czat na żywo
                </p>
            </div>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 text-center p-4">
                <MessageSquare className="h-10 w-10 mb-2 stroke-1" />
                <p className="text-sm">Masz pytania do lekcji? Napisz tutaj!</p>
            </div>
        )}

        {messages.map((message) => {
          const isMe = user?.user_id === message.user_id;
          const isDeleted = Boolean(message.is_deleted);
          const isTeacher = message.role === 'teacher';
          const isEdited = !isDeleted && message.updated_at && message.updated_at !== message.created_at;

          return (
            <div 
                key={message.message_id} 
                className={cn(
                    "flex w-full gap-2 animate-in slide-in-from-bottom-2 duration-300",
                    isMe ? "flex-row-reverse" : "flex-row"
                )}
            >
              <Avatar className="h-8 w-8 border shadow-sm shrink-0 mt-1">
                <AvatarFallback 
                    className={cn(
                        "text-[10px] font-bold", 
                        isTeacher ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100" : "bg-zinc-100 dark:bg-zinc-800"
                    )}
                >
                  {getInitials(message.first_name, message.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className={cn("flex flex-col max-w-[85%]", isMe ? "items-end" : "items-start")}>
                
                <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[10px] font-medium text-foreground/80">
                        {isMe ? "Ty" : `${message.first_name} ${message.last_name}`}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                        {formatDate(message.created_at)}
                    </span>
                </div>

                {editingId === message.message_id ? (
                  <div className="w-full min-w-[220px] bg-background border rounded-xl p-2 shadow-lg z-10">
                    <Textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        className="min-h-[60px] mb-2 resize-none focus-visible:ring-1 text-xs"
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-6 px-2 text-xs">
                            Anuluj
                        </Button>
                        <Button size="sm" onClick={handleUpdate} className="h-6 px-2 text-xs">
                            Zapisz
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                      
                      {isMe && !isDeleted && (
                        <div className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                        <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEdit(message)}>
                                        <Pencil className="mr-2 h-3 w-3" /> Edytuj
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(message.message_id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-3 w-3" /> Usuń
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      )}

                      <div 
                        className={cn(
                            "px-3 py-2 rounded-2xl text-xs sm:text-sm shadow-sm relative leading-relaxed whitespace-pre-wrap break-words",
                            isDeleted 
                                ? "bg-muted/30 text-muted-foreground border border-dashed italic rounded-br-2xl rounded-bl-2xl" 
                                : isMe 
                                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                                    : "bg-white dark:bg-muted border rounded-tl-none"
                        )}
                      >
                        {isDeleted ? (
                            <span className="flex items-center gap-2">
                                <Trash2 className="h-3 w-3" /> Wiadomość usunięta
                            </span>
                        ) : (
                            message.content
                        )}
                      </div>
                      
                      {isEdited && (
                        <div className={cn("text-[9px] text-muted-foreground mt-0.5 opacity-70 flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                            <Pencil className="h-2 w-2" /> Edytowano
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-background border-t shrink-0">
        <div className="relative flex items-end gap-2">
            <div className="relative flex-1">
                <Textarea 
                    placeholder="Napisz wiadomość..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[40px] max-h-[120px] pr-10 py-2.5 text-sm resize-none rounded-xl border-muted-foreground/20 focus-visible:ring-1 shadow-sm bg-background"
                    rows={1}
                />
                <div className="absolute right-1 top-1">
                    <Button 
                        onClick={handleAddMessage} 
                        disabled={isSending || !newMessage.trim()} 
                        size="icon"
                        className={cn("h-8 w-8 rounded-lg transition-all", newMessage.trim() ? "bg-primary" : "bg-muted text-muted-foreground hover:bg-muted")}
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}