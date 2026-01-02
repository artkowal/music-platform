import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import type { Meeting } from "@/types/Meeting";

interface WeeklyScheduleProps {
  meetings: Meeting[];
}

export function WeeklySchedule({ meetings }: WeeklyScheduleProps) {
  const navigate = useNavigate();
  
  // Sortowanie chronologiczne
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
  );

  // Grupowanie spotkań po dniach (yyyy-MM-dd)
  const groupedMeetings: { [key: string]: Meeting[] } = {};
  
  sortedMeetings.forEach(meeting => {
      const date = new Date(meeting.scheduled_time);
      const key = format(date, 'yyyy-MM-dd');
      if (!groupedMeetings[key]) groupedMeetings[key] = [];
      groupedMeetings[key].push(meeting);
  });

  // 5 najbliższych dni, w których coś jest
  const dayKeys = Object.keys(groupedMeetings).slice(0, 5);

  return (
    <Card className="h-full border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" /> Mój Tydzień
                </CardTitle>
                <CardDescription>
                    Plan zajęć na najbliższe dni.
                </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/calendar')} className="hidden sm:flex text-muted-foreground">
                Pełny kalendarz <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 px-4 md:px-6 space-y-8">
        {dayKeys.length === 0 ? (
             <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <p className="font-medium">Twój grafik jest pusty</p>
                <p className="text-xs mt-1">Brak zaplanowanych zajęć na najbliższy czas.</p>
                <Button variant="link" onClick={() => navigate('/dashboard/calendar')} className="mt-2 h-auto p-0 text-primary">
                    Przejdź do kalendarza
                </Button>
            </div>
        ) : (
            dayKeys.map((dateKey) => {
                const dateObj = new Date(dateKey);
                const dayMeetings = groupedMeetings[dateKey];
                
                let label = format(dateObj, "EEEE, d MMMM", { locale: pl });
                let isHighlight = false;

                if (isToday(dateObj)) {
                    label = "Dzisiaj";
                    isHighlight = true;
                } else if (isTomorrow(dateObj)) {
                    label = "Jutro";
                }

                return (
                    <div key={dateKey} className="relative pl-6 border-l-2 border-muted hover:border-primary/40 transition-colors">
                        <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-4 border-background ${isHighlight ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        
                        <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 capitalize ${isHighlight ? "text-primary" : "text-muted-foreground"}`}>
                            {label}
                        </h4>

                        <div className="space-y-3">
                            {dayMeetings.map(meeting => (
                                <div 
                                    key={meeting.meeting_id} 
                                    className="group flex items-center justify-between p-3 rounded-lg bg-background border shadow-sm hover:border-primary/30 transition-all cursor-default"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[45px] px-1 py-1 rounded bg-muted/30">
                                            <span className="font-mono font-bold text-base leading-none block">
                                                {format(new Date(meeting.scheduled_time), "HH:mm")}
                                            </span>
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                {meeting.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {meeting.course_title}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 pl-2">
                                        {meeting.type === 'online' ? (
                                             <Badge variant="secondary" className="text-[10px] bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border-blue-100 dark:border-blue-800">
                                                Online
                                             </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                Stacjonarnie
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })
        )}
        
        <Button variant="outline" className="w-full sm:hidden mt-4" onClick={() => navigate('/dashboard/calendar')}>
            Zobacz kalendarz
        </Button>
      </CardContent>
    </Card>
  );
}