import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { commentsApi } from "@/api/comments";
import type { Comment } from "@/types/Comment";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, MoreVertical, Pencil, Trash2, X} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface LessonCommentsProps {
  lessonId: number;
  accentColor: string;
  onClose?: () => void;
}

export function LessonComments({ lessonId, accentColor, onClose }: LessonCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsApi.getByLessonId(lessonId);
      setComments(data);
    } catch (error) {
      console.error("Błąd pobierania komentarzy", error);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchComments().then(() => scrollToBottom());
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      await commentsApi.create(lessonId, newComment);
      setNewComment("");
      await fetchComments();
      scrollToBottom();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;
    try {
      await commentsApi.delete(id);
      fetchComments();
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.comment_id);
    setEditContent(comment.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await commentsApi.update(editingId, editContent);
      setEditingId(null);
      fetchComments();
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
                <p className="text-[10px] text-muted-foreground">Czat lekcyjny</p>
            </div>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
        {comments.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 text-center p-4">
                <MessageSquare className="h-10 w-10 mb-2 stroke-1" />
                <p className="text-sm">Masz pytania do lekcji? Napisz tutaj!</p>
            </div>
        )}

        {comments.map((comment) => {
          const isMe = user?.user_id === comment.user_id;
          const isDeleted = Boolean(comment.is_deleted);
          const isTeacher = comment.role === 'teacher';
          const isEdited = !isDeleted && comment.updated_at && comment.updated_at !== comment.created_at;

          return (
            <div 
                key={comment.comment_id} 
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
                  {getInitials(comment.first_name, comment.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className={cn("flex flex-col max-w-[85%]", isMe ? "items-end" : "items-start")}>
                
                <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[10px] font-medium text-foreground/80">
                        {isMe ? "Ty" : `${comment.first_name} ${comment.last_name}`}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                        {formatDate(comment.created_at)}
                    </span>
                </div>

                {editingId === comment.comment_id ? (
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
                                    <DropdownMenuItem onClick={() => startEdit(comment)}>
                                        <Pencil className="mr-2 h-3 w-3" /> Edytuj
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(comment.comment_id)} className="text-destructive focus:text-destructive">
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
                            comment.content
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[40px] max-h-[120px] pr-10 py-2.5 text-sm resize-none rounded-xl border-muted-foreground/20 focus-visible:ring-1 shadow-sm bg-background"
                    rows={1}
                />
                <div className="absolute right-1 top-1">
                    <Button 
                        onClick={handleAddComment} 
                        disabled={isLoading || !newComment.trim()} 
                        size="icon"
                        className={cn("h-8 w-8 rounded-lg transition-all", newComment.trim() ? "bg-primary" : "bg-muted text-muted-foreground hover:bg-muted")}
                    >
                        {isLoading ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Send className="h-4 w-4 ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}