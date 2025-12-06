import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { pl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { meetingsApi } from "@/api/meetings";
import { Loader2, CalendarDays, CheckCircle2, Clock, XCircle, ChevronRight, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { WorkplaceStats } from "@/api/finances";
import type { Meeting } from "@/types/Meeting";
import { cn } from "@/lib/utils";

const locales = { 'pl': pl };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface DailySummaryEvent {
  start: Date;
  end: Date;
  title: string;
  resources: Meeting[];
}

interface Props {
  workplace: WorkplaceStats | null;
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

const CustomEvent = ({ event }: { event: DailySummaryEvent }) => {
  const meetings = event.resources;
  const count = meetings.length;
  
  const hasCancelled = meetings.some(m => m.status === 'cancelled');
  const hasPending = meetings.some(m => m.status === 'pending');
  
  let bgClass = "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
  
  if (hasCancelled) {
      bgClass = "bg-red-50 text-red-600 border-red-200 hover:bg-red-100";
  } else if (hasPending) {
      bgClass = "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
  }

  const labelSuffix = count === 1 ? "lekcja" : (count > 1 && count < 5 ? "lekcje" : "lekcji");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
            "w-full text-center text-xs font-medium py-1 px-1 rounded-md border transition-colors flex items-center justify-center gap-0.5 sm:gap-1",
            bgClass
        )}>
            <span>
                {count} 
                <span className="hidden sm:inline"> {labelSuffix}</span>
            </span>
            <ChevronRight className="h-3 w-3 opacity-50 hidden sm:block" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[85vw] sm:w-80 p-0 z-[60]" align="center" sideOffset={5}>
        <div className="p-3 border-b bg-muted/30">
            <h4 className="font-semibold text-sm">Zajęcia {format(event.start, "d MMMM", { locale: pl })}</h4>
        </div>
        
        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {meetings.map(meeting => {
                const isCancelled = meeting.status === 'cancelled';
                const isPending = meeting.status === 'pending';
                const isCompleted = meeting.status === 'completed';
                
                return (
                    <div key={meeting.meeting_id} className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm border border-transparent hover:border-border/50">
                        <div className="shrink-0 mt-0.5">
                            {isCancelled ? <XCircle className="h-4 w-4 text-red-500" /> :
                             isPending ? <Clock className="h-4 w-4 text-yellow-500" /> :
                             isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                             <div className="h-4 w-4 rounded-full border-2 border-primary" />}
                        </div>
                        
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <p className={cn("font-semibold text-sm truncate", isCancelled && "line-through text-muted-foreground")}>
                                {meeting.title}
                            </p>
                            
                            {meeting.student_names && (
                                <p className="text-xs text-foreground/80 flex items-center gap-1 truncate">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    {meeting.student_names}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span className="bg-muted px-1.5 py-0.5 rounded">
                                    {format(new Date(meeting.scheduled_time), "HH:mm")}
                                </span>
                                <span>•</span>
                                <span>{meeting.duration_minutes} min</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function WorkplaceDetailsDialog({ workplace, isOpen, onClose, month, year }: Props) {
  const [groupedEvents, setGroupedEvents] = useState<DailySummaryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);

  useEffect(() => {
    if (isOpen && workplace) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const start = startOfMonth(defaultDate).toISOString();
          const end = endOfMonth(defaultDate).toISOString();
          
          const allMeetings = await meetingsApi.getCalendar(start, end);
          const filtered = allMeetings.filter(m => m.workplace_id === workplace.workplace_id);

          const groups: Record<string, Meeting[]> = {};
          
          filtered.forEach(meeting => {
              const dateKey = format(new Date(meeting.scheduled_time), 'yyyy-MM-dd');
              if (!groups[dateKey]) {
                  groups[dateKey] = [];
              }
              groups[dateKey].push(meeting);
          });

          const summaryEvents: DailySummaryEvent[] = Object.keys(groups).map(dateKey => {
              const meetings = groups[dateKey].sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
              return {
                  start: new Date(dateKey),
                  end: new Date(dateKey),
                  title: '',
                  resources: meetings
              };
          });

          setGroupedEvents(summaryEvents);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, workplace, defaultDate]);

  const dayPropGetter = (date: Date) => {
    if (!isSameMonth(date, defaultDate)) {
        return {
            className: 'bg-muted/30 text-muted-foreground/30 pointer-events-none opacity-50',
        };
    }
    return {};
  };

  if (!workplace) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[950px] w-[95vw] h-[90vh] max-h-[850px] flex flex-col overflow-hidden p-0 gap-0 outline-none">
        
        <style>{`
            .rbc-calendar { border: none !important; }
            .rbc-header { padding: 12px 4px !important; font-weight: 600 !important; font-size: 0.75rem; border-bottom-color: hsl(var(--border)) !important; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.05em; }
            .rbc-month-view { border: 1px solid hsl(var(--border)) !important; border-radius: var(--radius); border-top: none !important; }
            .rbc-day-bg + .rbc-day-bg { border-left-color: hsl(var(--border)) !important; }
            .rbc-month-row + .rbc-month-row { border-top-color: hsl(var(--border)) !important; }
            .rbc-date-cell { padding: 8px !important; font-size: 0.85rem; font-weight: 500; color: hsl(var(--foreground)); }
            .rbc-today { background-color: hsl(var(--accent)/0.3) !important; }
            .rbc-off-range-bg { background-color: transparent !important; }
            
            .rbc-event { background: transparent !important; border: none !important; padding: 2px !important; outline: none !important; box-shadow: none !important; }
            .rbc-event:focus { outline: none !important; }
            .rbc-row-segment { padding: 0 4px; }

            .scroll-container::-webkit-scrollbar { display: none; }
            .scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <DialogHeader className="p-4 px-6 border-b shrink-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-3">
            <div 
                className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm text-white" 
                style={{ backgroundColor: workplace.color_hex }} 
            >
                <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
                <span>{workplace.name}</span>
                <span className="text-muted-foreground font-normal text-sm capitalize">
                    {format(defaultDate, 'LLLL yyyy', { locale: pl })}
                </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative p-4 min-h-0 bg-card/50 overflow-y-auto scroll-container">
            {loading && (
                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}
            
            <Calendar
                localizer={localizer}
                events={groupedEvents}
                date={defaultDate}
                onNavigate={() => {}} 
                view={Views.MONTH}
                onView={() => {}} 
                toolbar={false} 
                culture="pl"
                className="h-full font-sans min-h-[500px]"
                dayPropGetter={dayPropGetter}
                components={{
                    event: CustomEvent 
                }}
            />
        </div>
        
        <DialogFooter className="p-3 border-t bg-background shrink-0 flex-row justify-center items-center gap-6 text-xs text-muted-foreground font-medium z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-500" /> Odwołane
            </div>
            <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-yellow-500" /> Oczekujące
            </div>
            <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Zatwierdzone/Odbyte
            </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}