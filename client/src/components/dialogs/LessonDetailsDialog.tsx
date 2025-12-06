import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Video, ArrowRight, Play, CheckSquare, Download, LogOut, XCircle } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import type { Student } from "@/types/Student";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/api/courses";
import { lessonsApi } from "@/api/lessons";
import { hexToRgba } from "@/lib/colors";

interface Props {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  isTeacher: boolean;
  accentColor: string;
  teacherName?: string;
}

interface ZoomReportData {
    participants?: unknown[];
    duration?: number;
}

export function LessonDetailsDialog({ lesson, isOpen, onClose, onDelete, isTeacher, accentColor, teacherName }: Props) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  
  const [localIsStartedEarly, setLocalIsStartedEarly] = useState(false);
  const [localIsEndedEarly, setLocalIsEndedEarly] = useState(false);
  const [confirmations, setConfirmations] = useState<{ is_confirmed_by_student?: number, is_confirmed_by_teacher?: number }>({});
  
  const [zoomReport, setZoomReport] = useState<ZoomReportData | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isOpen && lesson) {
        setLocalIsStartedEarly(Boolean(lesson.is_started_early));
        setLocalIsEndedEarly(Boolean(lesson.is_ended_early));
        setConfirmations({
            is_confirmed_by_student: Number(lesson.is_confirmed_by_student),
            is_confirmed_by_teacher: Number(lesson.is_confirmed_by_teacher)
        });

        if (isTeacher) {
            coursesApi.getDetails(lesson.course_id)
                .then(res => setStudents(res.students))
                .catch(console.error);
        }

        lessonsApi.getReport(lesson.lesson_id).then(res => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if((res as any).confirmations) setConfirmations((res as any).confirmations);
            if(res.data) setZoomReport(res.data as ZoomReportData);
        }).catch(() => {});
    }
    setZoomReport(null);
  }, [isOpen, lesson, isTeacher]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!lesson) return null;

  const lessonStart = lesson.scheduled_time ? new Date(lesson.scheduled_time) : new Date();
  const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);
  const now = new Date();
  
  const isTimeReached = now >= lessonStart && now <= lessonEnd;
  // Lekcja aktywna jeśli: czas nadszedł LUB została wystartowana ręcznie
  const isLessonActive = (isTimeReached || localIsStartedEarly);
  const isOnline = lesson.lesson_type === 'online';
  
  const isCancelled = lesson.status === 'cancelled';
  // Zakończona jeśli: nauczyciel zakończył ręcznie LUB minął czas LUB ma status completed
  const isFinished = localIsEndedEarly || now > lessonEnd || lesson.status === 'completed';

  const handleStartMeeting = async () => {
    // URL
    const url = isTeacher ? lesson.zoom_start_url : lesson.zoom_join_url;
    
    if (!url) {
        alert("Błąd: Brak linku do spotkania. Sprawdź czy lekcja została poprawnie utworzona jako Online.");
        return;
    }
    window.open(url, '_blank');
    if (isTeacher && !localIsStartedEarly) {
        try {
            setLocalIsStartedEarly(true);
            await lessonsApi.startLessonEarly(lesson.lesson_id);
        } catch (err) { 
            console.error("Błąd zapisu statusu startu:", err);
        }
    }
  };

  const handleEndMeeting = async () => {
      if(!confirm("Czy na pewno zakończyć lekcję? Zostanie ona oznaczona jako 'Do potwierdzenia'.")) return;
      try {
          await lessonsApi.finishLesson(lesson.lesson_id);
          setLocalIsEndedEarly(true);
          setConfirmations(prev => ({ ...prev, is_confirmed_by_teacher: 1 }));
      } catch (err) { 
          console.error(err);
          alert("Błąd podczas kończenia lekcji.");
      }
  };

  const handleCancelLesson = async () => {
      try {
          await lessonsApi.cancelLesson(lesson.lesson_id);
          onClose();
      } catch (e) { console.error(e); }
  };

  const handleConfirm = async () => {
      try {
          await lessonsApi.confirmLesson(lesson.lesson_id);
          alert("Potwierdzono odbycie lekcji!");
          if (isTeacher) setConfirmations(prev => ({ ...prev, is_confirmed_by_teacher: 1 }));
          else setConfirmations(prev => ({ ...prev, is_confirmed_by_student: 1 }));
      } catch (e) { console.error(e); }
  };
  
  const handleGoToCourse = () => {
    onClose();
    navigate(`/dashboard/courses/${lesson.course_id}`);
  };

  const handleGetReport = async () => {
      try {
          const data = await lessonsApi.getZoomReport(lesson.lesson_id);
          setZoomReport(data as ZoomReportData);
      } catch {
          alert("Raport jeszcze niedostępny. Zoom potrzebuje kilku minut na przetworzenie danych po zakończeniu spotkania.");
      }
  };

  const handleDelete = () => {
      onDelete(lesson.lesson_id);
      onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
             <Badge 
                variant="outline" 
                style={{ 
                    color: accentColor, 
                    borderColor: accentColor,
                    backgroundColor: hexToRgba(accentColor, 0.1)
                }}
             >
                {isOnline ? "Zajęcia Online" : "Stacjonarnie"}
             </Badge>
             {isCancelled && <Badge variant="destructive">Odwołana</Badge>}
             {!isCancelled && isFinished && <Badge variant="secondary">Zakończona</Badge>}
             {!isCancelled && !isFinished && localIsStartedEarly && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trwa</Badge>}
          </div>
          <DialogTitle className="text-2xl leading-tight">{lesson.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5 py-2">
            
            <div className="flex flex-col gap-3 text-sm bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{format(lessonStart, "EEEE, d MMMM yyyy", { locale: pl })}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(lessonStart, "HH:mm")} - {format(lessonEnd, "HH:mm")} ({lesson.duration_minutes} min)</span>
                </div>
                <div className="flex items-center gap-3">
                    {isOnline ? <Video className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-orange-500" />}
                    <span>{isOnline ? "Platforma Zoom" : "Sala lekcyjna"}</span>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{isTeacher ? "Uczniowie" : "Prowadzący"}</h4>
                <div className="flex items-center gap-3 text-sm">
                    {isTeacher ? (
                         <span>{students.length > 0 ? students.map(s => `${s.first_name} ${s.last_name}`).join(", ") : "..."}</span>
                    ) : (
                        <span>{teacherName || "Nauczyciel"}</span>
                    )}
                </div>
            </div>

            {isCancelled && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Lekcja została odwołana przez: <strong>{lesson.cancelled_by === 'teacher' ? 'Nauczyciela' : 'Ucznia'}</strong>
                </div>
            )}

            {!isCancelled && !isFinished && isOnline && (
                <div className="mt-2 flex flex-col gap-3">
                    {isTeacher ? (
                         <Button onClick={handleStartMeeting} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md h-12 text-base">
                            <Play className="h-5 w-5" /> {localIsStartedEarly ? "Wróć do spotkania" : "Rozpocznij spotkanie (Zoom)"}
                        </Button>
                    ) : (
                        <Button onClick={handleStartMeeting} disabled={!isLessonActive} className="w-full gap-2 h-12 text-base" style={isLessonActive ? { backgroundColor: accentColor } : { opacity: 0.7 }}>
                            {isLessonActive ? <><Video className="h-5 w-5" /> Dołącz do zajęć</> : <><Clock className="h-4 w-4" /> Czekaj na start</>}
                        </Button>
                    )}
                    
                    {isTeacher && localIsStartedEarly && (
                        <Button variant="destructive" onClick={handleEndMeeting} className="w-full gap-2 border-2 border-destructive bg-background text-destructive hover:bg-destructive hover:text-white transition-colors">
                            <LogOut className="h-4 w-4" /> Zakończ lekcję (Wyślij do potwierdzenia)
                        </Button>
                    )}
                </div>
            )}

            {!isCancelled && isFinished && (
                <div className="mt-4 p-4 border border-orange-200 bg-orange-50/50 rounded-lg animate-in fade-in">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-900">
                        <CheckSquare className="h-4 w-4" /> Status lekcji
                    </h4>
                    
                    <div className="flex justify-between items-center mb-2 text-sm">
                        <span>Twój status:</span>
                        {(isTeacher && confirmations.is_confirmed_by_teacher) || (!isTeacher && confirmations.is_confirmed_by_student) ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                <CheckSquare className="h-3 w-3 mr-1" /> Potwierdzono
                            </Badge>
                        ) : (
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm" onClick={handleConfirm}>
                                Potwierdź odbycie
                            </Button>
                        )}
                    </div>

                    {isTeacher && isOnline && (
                        <div className="pt-3 border-t border-orange-200 mt-3">
                            {zoomReport ? (
                                <div className="text-xs bg-white p-2 rounded border">
                                    <p>Czas trwania: <strong>{zoomReport.duration} min</strong></p>
                                    <p>Uczestników: <strong>{Array.isArray(zoomReport.participants) ? zoomReport.participants.length : '?'}</strong></p>
                                </div>
                            ) : (
                                <Button variant="secondary" size="sm" className="w-full" onClick={handleGetReport}>
                                    <Download className="mr-2 h-3 w-3" /> Pobierz Raport Zoom
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0 mt-4 sm:justify-between items-center border-t pt-4">
            {!isCancelled && !isFinished && !localIsStartedEarly && (
                isConfirmingCancel ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-left-2">
                        <span className="text-xs text-destructive font-semibold">Na pewno?</span>
                        <Button variant="destructive" size="sm" onClick={handleCancelLesson}>Tak</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsConfirmingCancel(false)}>Nie</Button>
                    </div>
                ) : (
                    <Button 
                        variant="ghost" 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setIsConfirmingCancel(true)}
                    >
                        Odwołaj
                    </Button>
                )
            )}

            {isTeacher && isCancelled && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                    Usuń trwale
                </Button>
            )}

            <Button variant="secondary" onClick={handleGoToCourse} className="w-full sm:w-auto ml-auto">
                Przejdź do kursu <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}