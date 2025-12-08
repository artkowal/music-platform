import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { meetingsApi } from "@/api/meetings";
import { coursesApi, type SchedulerOption } from "@/api/courses";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/Course";
import { format, getHours, addMinutes, areIntervalsOverlapping, isSameDay } from "date-fns";
import { Repeat, Loader2, Video, MapPin, AlertCircle, CalendarClock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  courses?: Course[]; 
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  defaultCourseId?: number;
}

interface AvailabilitySlot {
    start: string;
    duration: number | string;
}

export function ScheduleMeetingDialog({ onSuccess, isOpen, onClose, initialDate, defaultCourseId }: Props) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [options, setOptions] = useState<SchedulerOption[]>([]);

  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [duration, setDuration] = useState("45");
  const [type, setType] = useState<"stationary" | "online">("online"); 
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState("4");
  
  const [busyHours, setBusyHours] = useState<number[]>([]);
  const [isDayOff, setIsDayOff] = useState(false);

  // 1. Pobranie danych przy otwarciu dialogu
  useEffect(() => {
    if (isOpen) {
        setDataLoading(true);
        coursesApi.getSchedulerList()
            .then(data => {
                setOptions(data);
                
                if (defaultCourseId) {
                    const found = data.find(opt => opt.course_id === defaultCourseId);
                    if (found) {
                        setSelectedPersonId(found.person_id.toString());
                        setSelectedCourseId(found.course_id.toString());
                    }
                }
            })
            .catch(err => console.error("Błąd pobierania listy do harmonogramu", err))
            .finally(() => setDataLoading(false));
            
        if (initialDate) {
            setDate(format(initialDate, "yyyy-MM-dd"));
        } else {
            if (!date) setDate(format(new Date(), "yyyy-MM-dd"));
        }
        
        setIsDayOff(false);
        setBusyHours([]);
        setSelectedHour(null);
        if (!defaultCourseId) {
            setSelectedPersonId("");
            setSelectedCourseId("");
        }
        if (!isTeacher) setType("online");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultCourseId, initialDate]);

  // 2. Filtrowanie unikalnych osób (do pierwszego Selecta)
  const uniquePeople = useMemo(() => {
      const map = new Map();
      options.forEach(opt => {
          if (!map.has(opt.person_id)) {
              map.set(opt.person_id, {
                  id: opt.person_id,
                  name: `${opt.first_name} ${opt.last_name}`
              });
          }
      });
      return Array.from(map.values());
  }, [options]);

  // 3. Filtrowanie kursów dostępnych dla wybranej osoby
  const availableCourses = useMemo(() => {
      if (!selectedPersonId) return [];
      return options.filter(opt => opt.person_id.toString() === selectedPersonId);
  }, [options, selectedPersonId]);

  // Automatyczny wybór kursu, jeśli osoba ma tylko jeden
  useEffect(() => {
      if (availableCourses.length === 1) {
          setSelectedCourseId(availableCourses[0].course_id.toString());
      } else if (availableCourses.length > 1 && !selectedCourseId) {
          const currentExists = availableCourses.some(c => c.course_id.toString() === selectedCourseId);
          if (!currentExists) setSelectedCourseId("");
      }
  }, [availableCourses, selectedCourseId]);


  // 4. Sprawdzanie dostępności (Availability)
  const fetchAvailability = useCallback(async () => {
      if (!date) return;
      
      if (!selectedCourseId) {
          setBusyHours([]);
          return;
      }
      
      setCheckingAvailability(true);
      setIsDayOff(false);
      setBusyHours([]);

      try {
          const cId = Number(selectedCourseId);

          const slots = await meetingsApi.getAvailability(cId, date);
          
          const hoursBlocked = new Set<number>();
          const gridHours = Array.from({ length: 14 }, (_, i) => i + 8); 

          const parsedSlots = slots.map((s: AvailabilitySlot) => {
              const start = new Date(s.start);
              const durationVal = Number(s.duration);
              const end = addMinutes(start, durationVal);
              return { start, end };
          });

          const selectedDuration = Number(duration) || 45;

          // Sprawdzamy każdą godzinę na siatce
          gridHours.forEach(h => {
              const checkStart = new Date(`${date}T${h.toString().padStart(2, '0')}:00:00`);
              const checkEnd = addMinutes(checkStart, selectedDuration); 

              const isBusy = parsedSlots.some(slot => {
                  return areIntervalsOverlapping(
                      { start: checkStart, end: checkEnd },
                      { start: slot.start, end: slot.end }
                  );
              });

              if (isBusy) {
                  hoursBlocked.add(h);
              }
          });

          if (hoursBlocked.size >= gridHours.length) {
              setIsDayOff(true); 
              setSelectedHour(null);
          } else {
              setBusyHours(Array.from(hoursBlocked));
              
              if (selectedHour && hoursBlocked.has(parseInt(selectedHour))) {
                  setSelectedHour(null);
              }
          }

      } catch (error) {
          console.error("Błąd sprawdzania dostępności:", error);
      } finally {
          setCheckingAvailability(false);
      }
  }, [selectedCourseId, date, duration, selectedHour]);

  // Wywołaj sprawdzanie przy zmianie kluczowych parametrów
  useEffect(() => {
      fetchAvailability();
  }, [fetchAvailability]);


  const handleSubmit = async () => {
    if(!selectedCourseId) {
        alert("Musisz wybrać kurs.");
        return;
    }
    if(!title || !date || !selectedHour) {
        alert("Uzupełnij wymagane pola.");
        return;
    }
    
    setLoading(true);
    const scheduledTime = new Date(`${date}T${selectedHour.padStart(2, '0')}:00:00`).toISOString();

    try {
        await meetingsApi.schedule({
            course_id: Number(selectedCourseId),
            title,
            description: description || "Zaplanowane spotkanie",
            scheduled_time: scheduledTime,
            duration_minutes: Number(duration),
            type: type,
            repeat_weeks: (isTeacher && isRecurring) ? Number(repeatWeeks) : 0
        });
        onClose();
        onSuccess();
        
        setTitle("");
        setDescription("");
        setIsRecurring(false);
        setSelectedHour(null);
    } catch (err) {
        console.error(err);
        alert("Błąd planowania. Termin może być już zajęty.");
    } finally {
        setLoading(false);
    }
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  const now = new Date();
  const currentHour = getHours(now);
  const isDateToday = isSameDay(new Date(date), now);

  const isFormInvalid = !selectedCourseId || !selectedPersonId || !title || !date || !selectedHour || isDayOff;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary"/> 
                Zaplanuj spotkanie
            </DialogTitle>
        </DialogHeader>
        
        {dataLoading ? (
            <div className="py-10 flex justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <div className="grid gap-5 py-2">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border">
                    
                    <div className="grid gap-2">
                        <Label>{isTeacher ? "Wybierz ucznia" : "Wybierz nauczyciela"}</Label>
                        <Select 
                            value={selectedPersonId} 
                            onValueChange={setSelectedPersonId} 
                            disabled={!!defaultCourseId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz osobę..." />
                            </SelectTrigger>
                            <SelectContent>
                                {uniquePeople.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 opacity-50"/> {p.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Wybierz kurs</Label>
                        <Select 
                            value={selectedCourseId} 
                            onValueChange={setSelectedCourseId} 
                            disabled={!selectedPersonId || !!defaultCourseId || availableCourses.length <= 1}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={availableCourses.length === 0 ? "Brak kursów" : "Wybierz kurs..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCourses.map(c => (
                                    <SelectItem key={c.course_id} value={c.course_id.toString()}>
                                        {c.course_title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="grid gap-2">
                    <Label>Tytuł spotkania</Label>
                    <Input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Np. Lekcja gry na gitarze" 
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input 
                        type="date" 
                        value={date} 
                        min={format(new Date(), "yyyy-MM-dd")}
                        onChange={e => setDate(e.target.value)} 
                        className="font-medium"
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                        <Label>Dostępne godziny (Start)</Label>
                        {checkingAvailability && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin"/> Sprawdzam grafik...
                            </span>
                        )}
                    </div>
                    
                    {isDayOff ? (
                        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg text-sm flex items-center justify-center gap-2 font-medium animate-in fade-in zoom-in-95">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>Brak wolnych terminów w tym dniu.</span>
                        </div>
                    ) : (
                        (!selectedCourseId) ? (
                            <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                                Wybierz osobę i kurs, aby zobaczyć grafik.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {hours.map((h) => {
                                    const isBusy = busyHours.includes(h);
                                    // Nie można wybrać godziny z przeszłości w dniu dzisiejszym
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
                                                        ? "bg-muted text-muted-foreground/30 cursor-not-allowed border-transparent opacity-60" 
                                                        : "bg-background hover:border-primary hover:bg-accent"
                                            )}
                                        >
                                            {h}:00
                                            {isBusy && <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Czas (min)</Label>
                        <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} disabled={isDayOff} />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Typ spotkania</Label>
                        {isTeacher ? (
                            <Select value={type} onValueChange={(val) => setType(val as "stationary" | "online")} disabled={isDayOff}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stationary"><span className="flex items-center gap-2"><MapPin className="h-3 w-3"/> Stacjonarne</span></SelectItem>
                                    <SelectItem value="online"><span className="flex items-center gap-2"><Video className="h-3 w-3"/> Online (Zoom)</span></SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                                <Video className="h-4 w-4" /> Online (Zoom)
                            </div>
                        )}
                    </div>
                </div>

                {isTeacher && (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="recurring" className="cursor-pointer">Powtarzaj co tydzień</Label>
                        </div>
                        <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} disabled={isDayOff} />
                    </div>
                )}
                
                {isRecurring && (
                     <div className="grid gap-2 animate-in slide-in-from-top-2">
                        <Label>Liczba tygodni</Label>
                        <Input type="number" min="2" max="52" value={repeatWeeks} onChange={e => setRepeatWeeks(e.target.value)} />
                     </div>
                )}

            </div>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button onClick={handleSubmit} disabled={loading || isFormInvalid}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Planowanie..." : "Zaplanuj lekcję"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}