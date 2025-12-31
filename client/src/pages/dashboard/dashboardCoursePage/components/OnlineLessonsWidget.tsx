import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Clock, Play, Loader2 } from "lucide-react";
import type { Meeting } from "@/types/Meeting";
import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  meetings: Meeting[];
  isTeacher: boolean;
  onOpenDetails: (meeting: Meeting) => void;
  onSchedule: () => void;
}

export function OnlineLessonsWidget({ meetings, onOpenDetails, onSchedule }: Props) {
  const now = new Date();
  
  const upcoming = meetings
    .filter(m => {
        if (m.status === 'cancelled' || m.status === 'completed' || m.status === 'noshow') return false;
        
        if (m.type !== 'online') return false;

        const meetingDate = new Date(m.scheduled_time);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        return meetingDate > yesterday;
    })
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  return (
    <Card className="h-full flex flex-col border-border bg-card shadow-sm">
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
             <Video className="h-4 w-4" />
          </div>
          Lekcje Online
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onSchedule} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Umów
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {upcoming.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 min-h-[120px] text-muted-foreground">
            <p className="text-sm">Brak zaplanowanych spotkań.</p>
            <Button variant="link" onClick={onSchedule} className="text-blue-500 text-xs h-auto p-0 mt-1">
              Zaplanuj teraz
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcoming.slice(0, 3).map(meeting => {
               const date = new Date(meeting.scheduled_time);
               const isPending = meeting.status === 'pending';

               return (
                <div 
                  key={meeting.meeting_id}
                  onClick={() => onOpenDetails(meeting)}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn("text-sm font-medium truncate", isPending && "opacity-70")}>{meeting.title}</h4>
                      {isPending && <Badge variant="secondary" className="text-[10px] h-4 px-1">Weryfikacja</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className={cn("flex items-center gap-1", isToday(date) && "text-blue-500 font-medium")}>
                         <Clock className="h-3 w-3" />
                         {isToday(date) ? format(date, "HH:mm") : format(date, "d MMM, HH:mm", { locale: pl })}
                      </span>
                      <span>• {meeting.duration_minutes} min</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPending ? (
                       <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    ) : (
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-blue-500 group-hover:bg-blue-500/10">
                          <Play className="h-4 w-4 fill-current" />
                       </Button>
                    )}
                  </div>
                </div>
               )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}