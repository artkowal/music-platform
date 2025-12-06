import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Video, Play, CheckSquare, LogOut, Loader2 } from "lucide-react";
import type { Meeting } from "@/types/Meeting";
import { format, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { meetingsApi } from "@/api/meetings";
import { hexToRgba } from "@/lib/colors";

interface Props {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  isTeacher: boolean;
  onRefresh: () => void;
}

export function MeetingDetailsDialog({ meeting, isOpen, onClose, isTeacher, onRefresh }: Props) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [localStatus, setLocalStatus] = useState(meeting?.status);

  useEffect(() => {
      if(isOpen && meeting) {
          setLocalStatus(meeting.status);
          setIsConfirmingCancel(false);
      }
  }, [isOpen, meeting]);

  if (!meeting) return null;

  const meetingStart = new Date(meeting.scheduled_time);
  const meetingEnd = new Date(meetingStart.getTime() + meeting.duration_minutes * 60000);
  const isOnline = meeting.type === 'online';
  const isPastTime = isPast(meetingEnd);
  
  const effectiveStatus = (meeting.type === 'stationary' && isPastTime && localStatus === 'planned') 
    ? 'completed' 
    : localStatus;

  const accentColor = meeting.workplace_color || "#3b82f6";

  const handleStartMeeting = async () => {
    const url = isTeacher ? meeting.zoom_start_url : meeting.zoom_join_url;
    if (!url) {
        alert("Błąd: Brak linku do spotkania.");
        return;
    }
    window.open(url, '_blank');
    
    if (isTeacher && effectiveStatus === 'planned') {
        try {
            await meetingsApi.startEarly(meeting.meeting_id);
        } catch (e) { console.error(e); }
    }
  };

  const handleFinish = async () => {
      if(!confirm("Zakończyć spotkanie? Spowoduje to wysłanie prośby o potwierdzenie do ucznia.")) return;
      try {
          await meetingsApi.finish(meeting.meeting_id);
          onRefresh();
          onClose();
      } catch (e) { console.error(e); }
  };

  const handleConfirm = async () => {
      try {
          await meetingsApi.confirm(meeting.meeting_id);
          alert("Potwierdzono odbycie lekcji!");
          onRefresh();
          onClose();
      } catch (e) { console.error(e); }
  };

  const handleCancel = async () => {
      try {
          await meetingsApi.cancel(meeting.meeting_id);
          onRefresh();
          onClose();
      } catch (e) { console.error(e); }
  };

  const showConfirmButton = effectiveStatus === 'pending' && (
      (isTeacher && !meeting.is_confirmed_by_teacher) || 
      (!isTeacher && !meeting.is_confirmed_by_student)
  );
  
  const waitingForOther = effectiveStatus === 'pending' && !showConfirmButton;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
             <Badge variant="outline" style={{ backgroundColor: hexToRgba(accentColor, 0.1), color: accentColor, borderColor: accentColor }}>
                {isOnline ? "Online" : "Stacjonarnie"}
             </Badge>
             {effectiveStatus === 'cancelled' && <Badge variant="destructive">Odwołana</Badge>}
             {effectiveStatus === 'completed' && <Badge variant="secondary" className="bg-green-100 text-green-700">Odbyta</Badge>}
             {effectiveStatus === 'pending' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Oczekuje na potwierdzenie</Badge>}
          </div>
          <DialogTitle className="text-2xl leading-tight">{meeting.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5 py-2">
            <div className="flex flex-col gap-3 text-sm bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{format(meetingStart, "EEEE, d MMMM yyyy", { locale: pl })}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(meetingStart, "HH:mm")} - {format(meetingEnd, "HH:mm")} ({meeting.duration_minutes} min)</span>
                </div>
                <div className="flex items-center gap-3">
                    {isOnline ? <Video className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-orange-500" />}
                    <span>{isOnline ? "Platforma Zoom" : "Sala lekcyjna"}</span>
                </div>
            </div>

            {isOnline && effectiveStatus !== 'cancelled' && effectiveStatus !== 'completed' && (
                <div className="flex flex-col gap-3">
                    <Button onClick={handleStartMeeting} className="w-full gap-2 h-12 text-base" style={{ backgroundColor: accentColor }}>
                        {isTeacher ? <><Play className="h-5 w-5" /> {effectiveStatus === 'pending' ? 'Wróć do spotkania' : 'Rozpocznij spotkanie'}</> : <><Video className="h-5 w-5" /> Dołącz do spotkania</>}
                    </Button>
                    
                    {isTeacher && effectiveStatus === 'planned' && (
                        <Button variant="outline" onClick={handleFinish} className="w-full text-orange-600 hover:text-orange-700 border-orange-200">
                            <LogOut className="h-4 w-4 mr-2" /> Zakończ lekcję
                        </Button>
                    )}
                </div>
            )}

            {effectiveStatus === 'pending' && (
                <div className="mt-2 p-4 bg-yellow-50 rounded border border-yellow-200 text-sm">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/> Status weryfikacji
                    </h4>
                    
                    {showConfirmButton ? (
                        <div className="flex justify-between items-center">
                            <span>Wymagane Twoje potwierdzenie:</span>
                            <Button size="sm" onClick={handleConfirm} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                <CheckSquare className="h-3 w-3 mr-1"/> Potwierdzam obecność
                            </Button>
                        </div>
                    ) : waitingForOther ? (
                         <div className="text-yellow-700">
                            Ty już potwierdziłeś. Oczekujemy na potwierdzenie przez {isTeacher ? "ucznia" : "nauczyciela"}.
                         </div>
                    ) : null}
                </div>
            )}
        </div>

        <DialogFooter className="sm:justify-between items-center border-t pt-4 mt-2">
            {effectiveStatus === 'planned' ? (
                isConfirmingCancel ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive">Na pewno?</span>
                        <Button variant="destructive" size="sm" onClick={handleCancel}>Tak</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsConfirmingCancel(false)}>Nie</Button>
                    </div>
                ) : (
                    <Button variant="ghost" onClick={() => setIsConfirmingCancel(true)} className="text-muted-foreground hover:text-destructive">
                        Odwołaj spotkanie
                    </Button>
                )
            ) : <div />}
            
            <Button variant="secondary" onClick={onClose}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}