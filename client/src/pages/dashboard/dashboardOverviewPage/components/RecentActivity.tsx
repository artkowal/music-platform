import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { commentsApi } from "@/api/comments";
import type { CommentNotification } from "@/types/Comment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export function RecentActivity() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<CommentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await commentsApi.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getInitials = (first: string, last: string) => `${first[0]}${last[0]}`;

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Bell className="h-5 w-5 text-primary" /> Powiadomienia
          {notifications.length > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                {notifications.length} nowych
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-70">
            <CheckCircle2 className="h-12 w-12 mb-3 stroke-1 text-green-500/50" />
            <p className="font-medium">Wszystko na bieżąco!</p>
            <p className="text-xs">Brak nowych powiadomień.</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <div 
                key={notif.comment_id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-1"
              >
                <div className="flex items-start gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarFallback className="text-xs font-bold bg-background">
                                {getInitials(notif.first_name, notif.last_name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 border-2 border-white rounded-full dark:border-slate-950" />
                    </div>

                    <div>
                        <p className="text-sm text-foreground leading-tight">
                            <span className="font-semibold">{notif.first_name} {notif.last_name}</span>
                            <span className="text-muted-foreground"> dodał komentarz do lekcji </span>
                            <span className="font-medium text-primary">"{notif.lesson_title}"</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: pl })}
                            </span>
                        </div>
                    </div>
                </div>

                <Button 
                    size="sm" 
                    variant="outline"
                    className="shrink-0 gap-2"
                    onClick={() => navigate(`/dashboard/courses/${notif.course_id}/lessons/${notif.lesson_id}`)}
                >
                    Przejdź do lekcji <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}