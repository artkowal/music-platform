import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, type Event, type View, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { lessonsApi } from "@/api/lessons";
import { coursesApi } from "@/api/courses";
import { Button } from "@/components/ui/button";
import { ScheduleLessonDialog } from "@/components/dialogs/SheduleLessonDialog";
import { LessonDetailsDialog } from "@/components/dialogs/LessonDetailsDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/Course";
import type { Lesson } from "@/types/Lesson";
import { Loader2, Plus } from "lucide-react";
import { CalendarToolbar } from "./components/CalendarToolbar";

const locales = {
  'pl': pl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface LessonEvent extends Event {
    resource: Lesson & { color?: string; teacherName?: string };
}

export default function DashboardCalendarPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [events, setEvents] = useState<LessonEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LessonEvent | null>(null);

  const fetchCalendarData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); 
    try {
      const allCourses = await coursesApi.getAll();
      setCourses(allCourses);

      let allLessons: LessonEvent[] = [];
      for (const course of allCourses) {
        const lessons = await lessonsApi.getByCourseId(course.course_id);
        
        const courseColor = course.color_hex || 'hsl(var(--primary))';
        const teacherName = `${course.teacher_name || ''} ${course.teacher_lastname || ''}`.trim();

        const mapped: LessonEvent[] = lessons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((l: any) => l.scheduled_time)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((l: any) => ({
                title: l.title,
                start: new Date(l.scheduled_time!),
                end: new Date(new Date(l.scheduled_time!).getTime() + l.duration_minutes * 60000),
                resource: { 
                    ...l, 
                    color: courseColor,
                    teacherName: teacherName
                }
            }));
        allLessons = [...allLessons, ...mapped];
      }
      setEvents(allLessons);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
      setSelectedSlotDate(slotInfo.start);
      setIsCreateOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: LessonEvent) => {
      setSelectedEvent(event);
      setIsDetailsOpen(true);
  }, []);

  const handleManualSchedule = () => {
      setSelectedSlotDate(null);
      setIsCreateOpen(true);
  };

  const handleDeleteLesson = async (id: number) => {
      try {
          await lessonsApi.delete(id);
          setIsDetailsOpen(false);
          fetchCalendarData(true); 
      } catch (error) {
          console.error(error);
          alert("Nie udało się usunąć lekcji.");
      }
  };

  const onNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(date);
    if (action === 'TODAY') {
        setDate(new Date());
        return;
    }
    switch (view) {
        case Views.MONTH:
            newDate.setMonth(date.getMonth() + (action === 'NEXT' ? 1 : -1));
            break;
        case Views.WEEK:
            newDate.setDate(date.getDate() + (action === 'NEXT' ? 7 : -7));
            break;
        case Views.DAY:
            newDate.setDate(date.getDate() + (action === 'NEXT' ? 1 : -1));
            break;
    }
    setDate(newDate);
  }, [view, date]);

  const eventPropGetter = (event: LessonEvent) => {
    const isPast = new Date(event.end!) < new Date();
    const isFinished = Boolean(event.resource.is_ended_early) || event.resource.status === 'completed';
    const isCancelled = event.resource.status === 'cancelled';

    const customColor = event.resource.color || '#2563eb';

    let backgroundColor = customColor;
    let opacity = 1;
    let borderLeft = '4px solid rgba(0,0,0,0.1)';
    let textDecoration = 'none';

    if (isCancelled) {
        backgroundColor = '#ef4444';
        opacity = 0.6;
        textDecoration = 'line-through';
        borderLeft = '4px solid transparent';
    } else if (isFinished || isPast) {
        // Odbyta lub miniona lekcja
        backgroundColor = 'hsl(var(--muted))';
        opacity = 0.6;
        borderLeft = '4px solid transparent';
    }

    return {
      style: {
        backgroundColor,
        color: (isFinished || isPast || isCancelled) ? 'hsl(var(--muted-foreground))' : '#fff',
        border: 'none',
        borderRadius: '4px',
        opacity,
        fontSize: '0.75rem',
        borderLeft,
        textDecoration,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start',
        padding: '2px 4px',
        lineHeight: '1.2'
      }
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Kalendarz zajęć</h2>
            <p className="text-muted-foreground">Zarządzaj grafikiem i lekcjami.</p>
        </div>
        <Button onClick={handleManualSchedule} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Umów nową lekcję
        </Button>
      </div>

      <CalendarToolbar 
        date={date} 
        view={view} 
        onNavigate={onNavigate} 
        onViewChange={(v) => setView(v as View)} 
      />

      <div className="relative min-h-[750px] bg-background rounded-xl border shadow-sm overflow-hidden">
        {loading && (
            <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )}
        
        <Calendar
            localizer={localizer}
            events={events}
            
            date={date}
            view={view}
            onNavigate={setDate}
            onView={setView}

            step={60}       
            timeslots={1}    
            min={new Date(0, 0, 0, 7, 0, 0)} 
            max={new Date(0, 0, 0, 22, 0, 0)}
            
            selectable={true} 
            onSelectSlot={handleSelectSlot} 
            onSelectEvent={handleSelectEvent}
            
            eventPropGetter={eventPropGetter}
            toolbar={false} 

            culture="pl"
            
            // KOMPONENTY NIESTANDARDOWE
            components={{
                event: ({ event }) => (
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* Tytuł pod godziną, mały i ucięty */}
                        <span className="text-[10px] font-semibold truncate">{event.title}</span>
                        {/* Opcjonalnie: Nazwa nauczyciela/ucznia */}
                        {/* <span className="text-[9px] opacity-80 truncate">{event.resource.teacherName}</span> */}
                    </div>
                )
            }}

            formats={{
                timeGutterFormat: (date, culture, localizer) => 
                    localizer?.format(date, 'HH:mm', culture) || '',
                eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`,
                dayHeaderFormat: (date, culture, localizer) =>
                    localizer?.format(date, 'EEEE, d MMMM', culture) || ''
            }}
            
            messages={{
                next: "Dalej",
                previous: "Wstecz",
                today: "Dziś",
                month: "Miesiąc",
                week: "Tydzień",
                day: "Dzień",
                agenda: "Agenda",
                date: "Data",
                time: "Godzina",
                event: "Lekcja",
                noEventsInRange: "Brak zaplanowanych lekcji w tym okresie.",
                showMore: total => `+ ${total} więcej`
            }}
        />
      </div>

      <ScheduleLessonDialog 
        courses={courses} 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchCalendarData(true)}
        initialDate={selectedSlotDate}
      />

      <LessonDetailsDialog 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        lesson={selectedEvent?.resource || null}
        isTeacher={isTeacher}
        onDelete={handleDeleteLesson}
        accentColor={selectedEvent?.resource.color || "hsl(var(--primary))"}
        teacherName={selectedEvent?.resource.teacherName}
      />
    </div>
  );
}