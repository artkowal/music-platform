import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight, Clock, CheckCircle2, MessageCircle, AlertTriangle, Info, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

export function RecentActivity() {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead } = useNotifications();

  const recentList = notifications.slice(0, 10);

  const getIcon = (type: string) => {
      switch(type) {
          case 'message': return <MessageCircle className="h-4 w-4 text-blue-500" />;
          case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
          case 'success': return <Check className="h-4 w-4 text-green-500" />;
          case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
          default: return <Info className="h-4 w-4 text-muted-foreground" />;
      }
  };

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Ładowanie powiadomień...</div>;

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Bell className="h-5 w-5 text-primary" /> Powiadomienia
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                {notifications.filter(n => !n.read).length} nowych
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {recentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-70">
            <CheckCircle2 className="h-12 w-12 mb-3 stroke-1 text-green-500/50" />
            <p className="font-medium">Wszystko na bieżąco!</p>
            <p className="text-xs">Brak powiadomień.</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentList.map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors animate-in fade-in slide-in-from-bottom-1",
                    !notif.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                )}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 bg-background p-2 rounded-full border shadow-sm">
                        {getIcon(notif.type)}
                    </div>

                    <div>
                        <p className={cn("text-sm leading-tight mb-1", !notif.read ? "font-semibold" : "font-medium text-foreground/80")}>
                            {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                             {notif.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: pl })}
                            </span>
                        </div>
                    </div>
                </div>

                {notif.link && (
                    <Button 
                        size="sm" 
                        variant="outline"
                        className="shrink-0 gap-2 h-8 text-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                            navigate(notif.link!);
                        }}
                    >
                        Przejdź <ArrowRight className="h-3 w-3" />
                    </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}