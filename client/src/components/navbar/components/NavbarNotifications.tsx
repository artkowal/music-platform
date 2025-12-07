import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X, MessageCircle, Info, AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export function NavbarNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, latestNotification, clearLatest } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    setIsOpen(false);
    if (link) navigate(link);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'message': return <MessageCircle className="h-4 w-4 text-blue-500" />;
          case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
          case 'success': return <Check className="h-4 w-4 text-green-500" />;
          default: return <Info className="h-4 w-4 text-muted-foreground" />;
      }
  };

  return (
    <div className="relative flex items-center">
      {latestNotification && !isOpen && (
          <div className="absolute top-10 right-0 w-72 bg-popover border shadow-xl rounded-lg p-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="flex justify-between items-start gap-2">
                 <div className="flex gap-2">
                    <div className="mt-0.5">{getIcon(latestNotification.type)}</div>
                    <div>
                        <p className="text-sm font-semibold">{latestNotification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{latestNotification.description}</p>
                    </div>
                 </div>
                 <button onClick={clearLatest} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
          </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="font-semibold text-sm">Powiadomienia</span>
            {unreadCount > 0 && (
                <button 
                    onClick={markAllAsRead} 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    <Check className="h-3 w-3" /> Oznacz wszystkie
                </button>
            )}
          </div>
          
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    Brak nowych powiadomień
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id, n.link)}
                            className={cn(
                                "flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0",
                                !n.read && "bg-primary/5"
                            )}
                        >
                            <div className="mt-1 shrink-0 bg-background p-1.5 rounded-full border shadow-sm">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={cn("text-sm leading-none", !n.read ? "font-semibold" : "font-medium")}>
                                    {n.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {n.description}
                                </p>
                                <p className="text-[10px] text-muted-foreground pt-1">
                                    {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: pl })}
                                </p>
                            </div>
                            {!n.read && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}