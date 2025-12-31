import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Views, type View, type SlotInfo, type EventProps } from "react-big-calendar";
import { startOfDay, endOfDay, areIntervalsOverlapping } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { meetingsApi } from "@/api/meetings";
import { coursesApi } from "@/api/courses";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingDialog } from "@/components/dialogs/SheduleMeetingDialog";
import { MeetingDetailsDialog } from "@/components/dialogs/MeetingDetailsDialog";
import { TimeOffDialog, type TimeOffData } from "@/components/dialogs/TimeOffDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/Course";
import type { Meeting } from "@/types/Meeting";
import { Loader2, Plus, CalendarOff } from "lucide-react";
import { CalendarToolbar } from "./components/CalendarToolbar";

import { localizer, messages } from "./config";
import { getEventStyles, getSlotStyles } from "./utils";
import type { CalendarEvent, ExtendedMeeting } from "./types";
import { StandardEvent } from "./components/StandardEvent";
import { MonthEvent } from "./components/MonthEvent";

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

  const [isTimeOffOpen, setIsTimeOffOpen] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOffData | null>(null);

  const parseDateFromDB = (dateStr: string) => {
      const normalized = dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z');
      return new Date(normalized);
  };

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      if (courses.length === 0) {
          const allCourses = await coursesApi.getAll();
          setCourses(allCourses);
      }

      const currentYear = new Date().getFullYear();
      const meetingsData = await meetingsApi.getCalendar(
          new Date(currentYear - 1, 0, 1).toISOString(),
          new Date(currentYear + 1, 11, 31).toISOString()
      ); 

      const mappedEvents: CalendarEvent[] = (meetingsData as ExtendedMeeting[]).map((m) => {
          const isTimeOff = m.event_type === 'time_off';
          
          let startDate = parseDateFromDB(m.scheduled_time);
          let endDate = new Date(startDate.getTime() + m.duration_minutes * 60000);

          if (isTimeOff) {
              if (m.duration_minutes >= 1400) {
                  startDate = startOfDay(startDate);
                  endDate = endOfDay(startDate);
              }
          }

          return {
            title: isTimeOff ? (m.title || "Niedostępny") : m.title,
            start: startDate,
            end: endDate,
            resource: m,
            allDay: isTimeOff ? m.duration_minutes >= 1400 : false 
          };
      });

      setEvents(mappedEvents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
      const hasConflict = events.some(ev => {
          if (ev.resource.event_type !== 'time_off') return false;
          return areIntervalsOverlapping(
              { start: slotInfo.start, end: slotInfo.end },
              { start: ev.start, end: ev.end }
          );
      });

      if (hasConflict) {
          alert("W tym terminie ustalono niedostępność.");
          return;
      }

      setSelectedSlotDate(slotInfo.start);
      setIsCreateOpen(true);
  }, [events]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
      const type = event.resource.event_type;

      if (type === 'time_off') {
          if (isTeacher) {
              setSelectedTimeOff({
                  id: event.resource.meeting_id,
                  start: event.start,
                  end: event.end,
                  title: event.title
              });
              setIsTimeOffOpen(true);
          }
          return;
      }

      setSelectedMeeting(event.resource);
      setIsDetailsOpen(true);
  }, [isTeacher]);

  const handleCreateTimeOff = () => {
      setSelectedTimeOff(null);
      setIsTimeOffOpen(true);
  };

  const handleGoToDay = (day: Date) => {
      setDate(day);
      setView(Views.DAY);
  };

  const components = useMemo(() => ({
    event: (props: EventProps<CalendarEvent>) => {
        if (view === Views.MONTH) {
            return (
                <MonthEvent 
                    event={props.event} 
                    events={events}
                    isTeacher={isTeacher}
                    onSelectEvent={handleSelectEvent}
                    onGoToDay={handleGoToDay}
                />
            );
        }
        return <StandardEvent event={props.event} isTeacher={isTeacher} />;
    }
  }), [view, events, isTeacher, handleSelectEvent]);

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* CSS do ukrycia domyślnego linku "+X more" */}
      <style>{`
         .rbc-month-view .rbc-show-more { display: none !important; }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Kalendarz zajęć</h2>
            <p className="text-muted-foreground">
                Zarządzaj swoim grafikiem.
            </p>
        </div>
        
        <div className="flex items-center gap-3">
            {isTeacher && (
                <Button 
                    variant="ghost" 
                    onClick={handleCreateTimeOff}
                    className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 gap-2 transition-colors"
                >
                    <CalendarOff className="h-4 w-4" /> 
                    <span>Dzień wolny</span>
                </Button>
            )}
            <Button onClick={() => { setSelectedSlotDate(null); setIsCreateOpen(true); }} className="shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Umów nowe spotkanie
            </Button>
        </div>
      </div>

      <CalendarToolbar 
        date={date} 
        view={view} 
        onNavigate={(action) => {
            const newDate = new Date(date);
            if (action === 'TODAY') setDate(new Date());
            else if (action === 'PREV') setDate(new Date(newDate.setDate(newDate.getDate() - 7))); 
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
            
            selectable={true}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            
            eventPropGetter={(e) => getEventStyles(e, view, events, isTeacher)}
            slotPropGetter={(d) => getSlotStyles(d, events)}
            
            components={components}
            toolbar={false}
            culture="pl"
            messages={messages}
            formats={{
                eventTimeRangeFormat: ({ start, end }, culture) =>
                    `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
                agendaDateFormat: 'd MMMM yyyy (EEEE)', 
                dayHeaderFormat: 'd MMMM yyyy (EEEE)'
            }}
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

      <TimeOffDialog 
        isOpen={isTimeOffOpen}
        onClose={() => setIsTimeOffOpen(false)}
        onSuccess={fetchCalendarData}
        initialData={selectedTimeOff}
      />
    </div>
  );
}