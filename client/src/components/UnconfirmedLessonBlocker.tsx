import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { meetingsApi } from "@/api/meetings";
import { useLocation } from "react-router-dom";

interface UnconfirmedMeeting {
  meeting_id: number;
  title: string;
  scheduled_time: string;
  teacher_name: string;
  teacher_lastname: string;
}

export function UnconfirmedLessonBlocker() {
  const [meeting, setMeeting] = useState<UnconfirmedMeeting | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const location = useLocation();

  const checkUnconfirmed = async () => {
    try {
      const data = await meetingsApi.getUnconfirmed();
      
      console.log("Blocker check result:", data);

      if (data && data.meeting) {
        setMeeting(data.meeting);
      } else {
        setMeeting(null);
      }
    } catch (error) {
      console.error("Błąd sprawdzania lekcji:", error);
    }
  };

  useEffect(() => {
    checkUnconfirmed();
    const interval = setInterval(checkUnconfirmed, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleConfirm = async () => {
    if (!meeting) return;
    try {
      await meetingsApi.confirm(meeting.meeting_id);
      setMeeting(null);
    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas potwierdzania.");
    }
  };

  const handleDispute = async () => {
    if (!meeting) return;
    try {
      await meetingsApi.dispute(meeting.meeting_id);
      
      setMeeting(null);
      setIsDisputeOpen(false);
      alert("Zgłoszenie zostało wysłane do administracji.");
    } catch (error) {
      console.error(error);
      alert("Błąd wysyłania zgłoszenia.");
    }
  };

  if (!meeting) return null;

  return (
    <>
      <AlertDialog open={!!meeting && !isDisputeOpen}>
        <AlertDialogContent className="max-w-md" onEscapeKeyDown={(e: Event) => e.preventDefault()}>
          <AlertDialogHeader>
            <div className="mx-auto bg-green-100 p-3 rounded-full mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Potwierdź odbycie lekcji
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2 pt-2">
              <p>
                Nauczyciel <strong>{meeting.teacher_name} {meeting.teacher_lastname}</strong> oznaczył lekcję 
                <span className="font-semibold text-foreground"> "{meeting.title}"</span> jako zakończoną.
              </p>
              <p className="text-xs text-muted-foreground">
                Data: {format(new Date(meeting.scheduled_time), "d MMMM yyyy, HH:mm", { locale: pl })}
              </p>
              <p className="pt-2 font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                Aby korzystać dalej z aplikacji, musisz potwierdzić lub zgłosić problem z tą lekcją.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-4">
            <Button size="lg" onClick={handleConfirm} className="w-full bg-green-600 hover:bg-green-700">
              Tak, potwierdzam odbycie zajęć
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsDisputeOpen(true)} 
              className="w-full text-muted-foreground hover:text-destructive"
            >
              Nie potwierdzam (zgłoś problem)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="py-2">
              <p className="mb-2">
                Czy jesteś pewien, że ta lekcja się nie odbyła?
              </p>
              <p className="font-semibold text-destructive">
                Nauczyciel nie dostanie należnego wynagrodzenia za te zajęcia.
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                Sprawa zostanie przekazana do administratora w celu wyjaśnienia. 
                Bezzasadne zgłoszenia mogą skutkować blokadą konta.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDisputeOpen(false)}>
              Wróć
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDispute} className="bg-destructive hover:bg-destructive/90">
              Zgłaszam, że lekcja się nie odbyła
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}