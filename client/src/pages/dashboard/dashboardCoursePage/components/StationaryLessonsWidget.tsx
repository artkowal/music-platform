import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import type { Meeting } from "@/types/Meeting";
import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  meetings: Meeting[];
  onOpenDetails: (meeting: Meeting) => void;
}

export function StationaryLessonsWidget({ meetings, onOpenDetails }: Props) {
  const upcoming = meetings
    .filter(m => m.type === 'stationary' && m.status !== 'cancelled' && m.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  return (
    <Card className="h-full flex flex-col border-border bg-card shadow-sm">
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-500">
                <MapPin className="h-4 w-4" />
            </div>
            Grafik Stacjonarny
          </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {upcoming.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 min-h-[120px] text-muted-foreground">
             <p className="text-sm">Brak nadchodzących lekcji.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
             {upcoming.slice(0, 3).map(meeting => {
                const date = new Date(meeting.scheduled_time);
                return (
                    <div 
                        key={meeting.meeting_id}
                        onClick={() => onOpenDetails(meeting)}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-muted rounded-md text-muted-foreground shrink-0 border border-border">
                            <span className="text-[10px] uppercase font-bold">{format(date, "MMM", { locale: pl })}</span>
                            <span className="text-sm font-bold leading-none text-foreground">{format(date, "d")}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{meeting.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className={cn(isToday(date) && "text-orange-500 font-medium")}>
                                    {format(date, "EEEE, HH:mm", { locale: pl })}
                                </span>
                            </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                )
             })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}