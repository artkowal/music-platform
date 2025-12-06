import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    CalendarDays, MapPin, Video, CheckCircle2, Clock, XCircle, ArrowRight, Loader2, ChevronDown, ChevronUp, History, MoreHorizontal 
} from "lucide-react";
import type { Meeting } from "@/types/Meeting";
import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { MeetingDetailsDialog } from "@/components/dialogs/MeetingDetailsDialog";
import { cn } from "@/lib/utils";

interface MeetingListProps {
  meetings: Meeting[];
  isTeacher: boolean;
  onRefresh: () => void;
}

export function MeetingList({ meetings, isTeacher, onRefresh }: MeetingListProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleOpenDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailsOpen(true);
  };

  if (meetings.length === 0) return null;

  // Podział na grupy
  const pendingMeetings = meetings.filter(m => m.status === 'pending');
  
  const allUpcoming = meetings
    .filter(m => m.status === 'planned' && new Date(m.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  const historyMeetings = meetings
    .filter(m => m.status === 'completed' || m.status === 'cancelled' || (m.status === 'planned' && new Date(m.scheduled_time) <= new Date()))
    .sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime());

  // Wybór priorytetowych spotkań do wyświetlenia
  const nextOnline = allUpcoming.find(m => m.type === 'online');
  const nextStationary = allUpcoming.find(m => m.type === 'stationary');
  
  const shownIds = new Set<number>();
  pendingMeetings.forEach(m => shownIds.add(m.meeting_id));
  if (nextOnline) shownIds.add(nextOnline.meeting_id);
  if (nextStationary) shownIds.add(nextStationary.meeting_id);

  const priorityList = [
      ...pendingMeetings,
      ...(nextOnline ? [nextOnline] : []),
      ...(nextStationary ? [nextStationary] : [])
  ].sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  // Reszta nadchodzących 
  const hiddenUpcoming = allUpcoming.filter(m => !shownIds.has(m.meeting_id));


  const renderMeetingCard = (meeting: Meeting) => {
      const isOnline = meeting.type === 'online';
      const date = new Date(meeting.scheduled_time);
      const isFinished = meeting.status === 'completed';
      const isPending = meeting.status === 'pending';
      const isCancelled = meeting.status === 'cancelled';
      
      let containerClass = "border-l-4 hover:shadow-md transition-all cursor-pointer";
      let iconBg = "";
      let iconColor = "";
      let statusBadge = null;

      if (isCancelled) {
        containerClass += " border-red-500 bg-red-50/20 opacity-70 grayscale-[0.5]";
        iconBg = "bg-red-100";
        iconColor = "text-red-600";
        statusBadge = <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Odwołane</Badge>;
      } else if (isFinished) {
        containerClass += " border-gray-400 bg-gray-50/40 opacity-75";
        iconBg = "bg-gray-100";
        iconColor = "text-gray-600";
        statusBadge = <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-gray-200 text-gray-700">Zakończone</Badge>;
      } else if (isPending) {
        containerClass += " border-yellow-500 bg-yellow-50/30";
        iconBg = "bg-yellow-100";
        iconColor = "text-yellow-600";
        statusBadge = <Badge className="h-5 px-1.5 text-[10px] bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 animate-pulse">Weryfikacja</Badge>;
      } else if (isOnline) {
        containerClass += " border-blue-500 bg-blue-50/30";
        iconBg = "bg-blue-100";
        iconColor = "text-blue-600";
      } else {
        containerClass += " border-orange-500 bg-orange-50/30";
        iconBg = "bg-orange-100";
        iconColor = "text-orange-600";
      }

      return (
        <Card 
            key={meeting.meeting_id} 
            className={`p-3 flex items-center justify-between group ${containerClass}`}
            onClick={() => handleOpenDetails(meeting)}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                {isCancelled ? <XCircle className="h-5 w-5" /> :
                 isFinished ? <CheckCircle2 className="h-5 w-5" /> :
                 isPending ? <Loader2 className="h-5 w-5 animate-spin" /> :
                 isOnline ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            </div>

            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={cn("font-semibold text-sm truncate", (isFinished || isCancelled) && "text-muted-foreground line-through decoration-transparent")}>
                        {meeting.title}
                    </h3>
                    {statusBadge}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={cn("flex items-center gap-1 font-medium", isToday(date) ? "text-green-600 font-bold" : "text-foreground/80")}>
                        <CalendarDays className="h-3 w-3" /> 
                        {isToday(date) ? "Dzisiaj, " + format(date, "HH:mm") : format(date, "d MMM, HH:mm", { locale: pl })}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {meeting.duration_minutes} min
                    </span>
                    <span className="hidden sm:inline-block">•</span>
                    <span className="hidden sm:inline-block">{isOnline ? "Online" : "Stacjonarnie"}</span>
                </div>
            </div>
          </div>

          <div className="hidden sm:block pl-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                  <ArrowRight className="h-4 w-4" />
              </Button>
          </div>
        </Card>
      );
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Harmonogram
        </h2>
        
        {allUpcoming.length > 0 && (
             <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                 Następne: {allUpcoming.length > 0 ? format(new Date(allUpcoming[0].scheduled_time), "d MMM", { locale: pl }) : '-'}
             </Badge>
        )}
      </div>

      <div className="grid gap-2">
        {priorityList.length > 0 ? (
            priorityList.map(renderMeetingCard)
        ) : (
             <div className="text-center py-6 text-sm text-muted-foreground bg-muted/10 border border-dashed rounded-lg">
                Brak zaplanowanych spotkań.
            </div>
        )}

        {hiddenUpcoming.length > 0 && (
            <div className="mt-1">
                {!showAllUpcoming ? (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllUpcoming(true)}
                        className="w-full h-8 text-xs text-muted-foreground hover:text-primary flex gap-2"
                    >
                        <MoreHorizontal className="h-3 w-3" /> Pokaż wszystkie zaplanowane ({hiddenUpcoming.length})
                    </Button>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        {hiddenUpcoming.map(renderMeetingCard)}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAllUpcoming(false)}
                            className="w-full h-6 text-[10px] text-muted-foreground"
                        >
                            <ChevronUp className="h-3 w-3 mr-1" /> Zwiń
                        </Button>
                    </div>
                )}
            </div>
        )}
      </div>

      {historyMeetings.length > 0 && (
        <div className="pt-4 border-t">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground h-9 text-xs"
            >
                <span className="flex items-center gap-2"><History className="h-3 w-3" /> Archiwum spotkań ({historyMeetings.length})</span>
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {showHistory && (
                <div className="grid gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                    {historyMeetings.map(renderMeetingCard)}
                </div>
            )}
        </div>
      )}

      <MeetingDetailsDialog 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); onRefresh(); }}
        meeting={selectedMeeting}
        isTeacher={isTeacher}
        onRefresh={onRefresh}
      />
    </div>
  );
}