import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { lessonsApi } from "@/api/lessons";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/Course";
import { format, parseISO, getHours, isToday } from "date-fns";
import { Repeat, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  courses: Course[];
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  defaultCourseId?: number;
}

export function ScheduleLessonDialog({ courses, onSuccess, isOpen, onClose, initialDate, defaultCourseId }: Props) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [courseId, setCourseId] = useState(defaultCourseId?.toString() || "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [duration, setDuration] = useState("45");
  const [type, setType] = useState<"stationary" | "online">("online"); 
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState("12");
  
  const [busyHours, setBusyHours] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
        if (defaultCourseId) setCourseId(defaultCourseId.toString());
        
        if (initialDate) {
            setDate(format(initialDate, "yyyy-MM-dd"));
            const hour = getHours(initialDate);
            // Jeśli kliknięta godzina jest w przeszłości (i to dzisiaj), nie zaznaczaj jej automatycznie
            const isPastHour = isToday(initialDate) && hour <= getHours(new Date());
            
            if (!isPastHour && hour >= 8 && hour <= 21) {
                setSelectedHour(hour.toString());
            } else {
                setSelectedHour(null);
            }
        } else if (!date) {
            setDate(format(new Date(), "yyyy-MM-dd"));
            setSelectedHour(null);
        }
        
        if (!isTeacher) setType("online");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialDate, defaultCourseId, isTeacher]);

  useEffect(() => {
      const fetchAvailability = async () => {
          if (!courseId || !date) return;
          
          setCheckingAvailability(true);
          try {
              const slots = await lessonsApi.getAvailability(Number(courseId), date);
              const hours = slots.map(s => getHours(parseISO(s.start)));
              setBusyHours(hours);
          } catch (error) {
              console.error(error);
          } finally {
              setCheckingAvailability(false);
          }
      };

      fetchAvailability();
  }, [courseId, date]);

  const handleSubmit = async () => {
    if(!courseId || !title || !date || !selectedHour) return;
    setLoading(true);

    const scheduledTime = new Date(`${date}T${selectedHour.padStart(2, '0')}:00:00`).toISOString();

    try {
        await lessonsApi.schedule({
            course_id: Number(courseId),
            title,
            description: "Zaplanowana lekcja",
            scheduled_time: scheduledTime,
            duration_minutes: Number(duration),
            lesson_type: type,
            repeat_weeks: (isTeacher && isRecurring) ? Number(repeatWeeks) : 0
        });
        onClose();
        onSuccess();
        
        setTitle("");
        setIsRecurring(false);
        setSelectedHour(null);
    } catch (err) {
        console.error(err);
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || "Błąd planowania. Sprawdź czy termin nie jest zajęty.");
    } finally {
        setLoading(false);
    }
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  
  const now = new Date();
  const currentHour = getHours(now);
  const isDateToday = date === format(now, "yyyy-MM-dd");

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>Zaplanuj lekcję</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
            
            <div className="grid gap-2">
                <Label>Wybierz kurs</Label>
                <Select value={courseId} onValueChange={setCourseId} disabled={!!defaultCourseId}>
                    <SelectTrigger><SelectValue placeholder="Wybierz kurs" /></SelectTrigger>
                    <SelectContent>
                        {courses.map(c => (
                            <SelectItem key={c.course_id} value={c.course_id.toString()}>{c.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="grid gap-2">
                <Label>Temat lekcji</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Ćwiczenia praktyczne" />
            </div>

            <div className="grid gap-2">
                <Label>Data</Label>
                <Input 
                    type="date" 
                    value={date} 
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={e => { setDate(e.target.value); setSelectedHour(null); }} 
                />
            </div>

            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label>Dostępne godziny (Start)</Label>
                    {checkingAvailability && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Sprawdzam grafik...</span>}
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {hours.map((h) => {
                        const isBusy = busyHours.includes(h);
                        // Blokuj jeśli: zajęte LUB (jest dzisiaj I godzina jest mniejsza/równa obecnej)
                        const isPast = isDateToday && h <= currentHour;
                        const isDisabled = isBusy || isPast;

                        const isSelected = selectedHour === h.toString();
                        
                        return (
                            <button
                                key={h}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setSelectedHour(h.toString())}
                                className={cn(
                                    "py-2 rounded-md text-sm font-medium border transition-all relative overflow-hidden",
                                    isSelected 
                                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-offset-1 ring-primary" 
                                        : isDisabled
                                            ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed" 
                                            : "bg-background hover:border-primary hover:bg-accent"
                                )}
                            >
                                {h}:00
                                {isPast && !isBusy && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                                        
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {!selectedHour && <p className="text-[10px] text-red-500 mt-1">Wybierz godzinę rozpoczęcia</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Czas trwania (min)</Label>
                    <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
                
                <div className="grid gap-2">
                    <Label>Typ lekcji</Label>
                    {isTeacher ? (
                        <Select value={type} onValueChange={(val) => setType(val as "stationary" | "online")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stationary">Stacjonarna</SelectItem>
                                <SelectItem value="online">Online (Zoom)</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
                            <Video className="h-4 w-4" /> Online (Zoom)
                        </div>
                    )}
                </div>
            </div>

            {isTeacher && (
                <>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="recurring" className="cursor-pointer">Powtarzaj co tydzień</Label>
                        </div>
                        <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>

                    {isRecurring && (
                        <div className="grid gap-2 animate-in slide-in-from-top-2 fade-in">
                            <Label>Przez ile tygodni?</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    min="2" 
                                    max="52" 
                                    value={repeatWeeks} 
                                    onChange={e => setRepeatWeeks(e.target.value)} 
                                />
                                <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                                    (np. 20 = semestr)
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

        </div>
        <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading || !selectedHour}>
                {loading ? "Zapisywanie..." : "Zaplanuj"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}