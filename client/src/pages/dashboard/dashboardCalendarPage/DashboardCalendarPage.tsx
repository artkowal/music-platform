import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, type View, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { meetingsApi } from "@/api/meetings";
import { coursesApi } from "@/api/courses";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingDialog } from "@/components/dialogs/SheduleMeetingDialog";
import { MeetingDetailsDialog } from "@/components/dialogs/MeetingDetailsDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/Course";
import type { Meeting } from "@/types/Meeting";
import { Loader2, Plus } from "lucide-react";
import { CalendarToolbar } from "./components/CalendarToolbar";

const locales = { 'pl': pl };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: Meeting;
}

export default function DashboardCalendarPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const allCourses = await coursesApi.getAll();
      setCourses(allCourses);

      const meetingsData = await meetingsApi.getCalendar(
          new Date(new Date().getFullYear(), 0, 1).toISOString(), // Od początku roku
          new Date(new Date().getFullYear(), 11, 31).toISOString() // Do końca roku
      ); 

      const mappedEvents: CalendarEvent[] = meetingsData.map(m => ({
          title: m.title,
          start: new Date(m.scheduled_time),
          end: new Date(new Date(m.scheduled_time).getTime() + m.duration_minutes * 60000),
          resource: m
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
      setSelectedSlotDate(slotInfo.start);
      setIsCreateOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
      setSelectedMeeting(event.resource);
      setIsDetailsOpen(true);
  }, []);

  const eventPropGetter = (event: CalendarEvent) => {
    const meeting = event.resource;
    const isPast = event.end < new Date();
    const isCancelled = meeting.status === 'cancelled';
    const isCompleted = meeting.status === 'completed';

    const baseColor = meeting.workplace_color || '#2563eb';
    
    const style: React.CSSProperties = {
        backgroundColor: baseColor,
        color: '#fff',
        borderLeft: '4px solid rgba(0,0,0,0.1)',
        opacity: 1
    };

    if (isCancelled) {
        style.backgroundColor = '#ef4444';
        style.textDecoration = 'line-through';
        style.opacity = 0.6;
    } else if (isCompleted || isPast) {
        style.backgroundColor = '#94a3b8';
        style.opacity = 0.8;
    }

    return { style };
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Kalendarz zajęć</h2>
            <p className="text-muted-foreground">Zarządzaj grafikiem i spotkaniami.</p>
        </div>
        <Button onClick={() => { setSelectedSlotDate(null); setIsCreateOpen(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Umów nowe spotkanie
        </Button>
      </div>

      <CalendarToolbar 
        date={date} 
        view={view} 
        onNavigate={(action) => {
            const newDate = new Date(date);
            if (action === 'TODAY') setDate(new Date());
            else if (action === 'PREV') setDate(new Date(newDate.setDate(newDate.getDate() - 7))); // Uproszczone
            else setDate(new Date(newDate.setDate(newDate.getDate() + 7)));
        }} 
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
            messages={{ next: "Dalej", previous: "Wstecz", today: "Dziś", month: "Miesiąc", week: "Tydzień", day: "Dzień" }}
        />
      </div>

      <ScheduleMeetingDialog 
        courses={courses} 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchCalendarData}
        initialDate={selectedSlotDate}
      />

      <MeetingDetailsDialog 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        meeting={selectedMeeting}
        isTeacher={isTeacher}
        onRefresh={fetchCalendarData}
      />
    </div>
  );
}