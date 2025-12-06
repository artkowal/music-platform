import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, ArrowRight, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import type { Meeting } from "@/types/Meeting";
import { Badge } from "@/components/ui/badge";

interface Props {
  meetings: Meeting[];
}

export function UpcomingMeetings({ meetings }: Props) {
  const navigate = useNavigate();

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Dzisiaj";
    if (isTomorrow(date)) return "Jutro";
    return format(date, "d MMM", { locale: pl });
  };

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm h-full">
        <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="h-5 w-5 text-primary" /> Nadchodzące spotkania
        </CardTitle>
        <CardDescription>
            {meetings.length > 0 
                ? `Masz ${meetings.length} zaplanowanych spotkań.` 
                : "Brak zaplanowanych spotkań na najbliższe dni."}
        </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            {meetings.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                    Twój grafik jest pusty.
                    <br/>
                    <Button variant="link" onClick={() => navigate('/dashboard/calendar')}>
                        Przejdź do kalendarza
                    </Button>
                </div>
            )}

            {meetings.map((meeting) => {
                const isOnline = meeting.type === 'online';
                const date = new Date(meeting.scheduled_time);
                const time = format(date, "HH:mm");

                return (
                <div key={meeting.meeting_id} className="flex items-center justify-between bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm hover:border-primary/40">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-background border p-2 rounded-md text-center min-w-[60px] shrink-0">
                            <span className="block text-[10px] text-muted-foreground uppercase font-bold">
                                {formatDateLabel(meeting.scheduled_time)}
                            </span>
                            <span className="block text-lg font-bold text-foreground leading-none mt-0.5">
                                {time}
                            </span>
                        </div>
                        
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{meeting.title}</p>
                            <div className="text-xs text-muted-foreground truncate">
                                {meeting.course_title}
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 ml-2">
                        {isOnline ? (
                            <Badge variant="secondary" className="text-blue-600 bg-blue-50">
                                <Video className="h-3 w-3 mr-1" /> Online
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" /> Stacjonarnie
                            </Badge>
                        )}
                    </div>
                </div>
                );
            })}

            {meetings.length > 0 && (
                <Button variant="ghost" className="w-full text-xs mt-2" onClick={() => navigate('/dashboard/calendar')}>
                    Zobacz pełny kalendarz <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
            )}
        </CardContent>
    </Card>
  );
}