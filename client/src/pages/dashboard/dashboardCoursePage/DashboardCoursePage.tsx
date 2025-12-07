import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coursesApi } from "@/api/courses";
import { lessonsApi } from "@/api/Lesson";
import { meetingsApi } from "@/api/meetings";
import { useAuth } from "@/hooks/useAuth";
import { hexToHsl } from "@/lib/colors";
import type { Course } from "@/types/Course";
import type { Lesson } from "@/types/Lesson";
import type { Meeting } from "@/types/Meeting";

import { CourseHeader } from "./components/CourseHeader";
import { LessonList } from "./components/LessonList";
import { OnlineLessonsWidget } from "./components/OnlineLessonsWidget";
import { StationaryLessonsWidget } from "./components/StationaryLessonsWidget";

import { MeetingDetailsDialog } from "@/components/dialogs/MeetingDetailsDialog";
import { ScheduleMeetingDialog } from "@/components/dialogs/SheduleMeetingDialog";

import { Button } from "@/components/ui/button";
import { History, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DashboardCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Stany dla Dialogów
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  
  // Stan dla Historii
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const { course: courseData } = await coursesApi.getDetails(id);
      setCourse(courseData);

      const [lessonsData, meetingsData] = await Promise.all([
          lessonsApi.getByCourseId(id),
          meetingsApi.getByCourseId(id)
      ]);

      setLessons(lessonsData);
      setMeetings(meetingsData);
    } catch (error) {
      console.error(error);
      navigate("/dashboard/courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailsOpen(true);
  };

  if (loading) return <div className="p-8">Ładowanie kursu...</div>;
  if (!course) return null;

  const accentColor = course.color_hex || "hsl(var(--primary))";
  
  const pageStyles = course.color_hex ? {
    '--primary': hexToHsl(course.color_hex),
    '--ring': hexToHsl(course.color_hex),
  } as React.CSSProperties : {};

  const historyMeetings = meetings
    .filter(m => m.status === 'completed' || m.status === 'cancelled' || (m.status === 'planned' && new Date(m.scheduled_time) <= new Date()))
    .sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime());

  return (
    <div style={pageStyles} className="animate-in fade-in duration-500">
      
      <CourseHeader 
        course={course} 
        isTeacher={isTeacher} 
        onRefresh={fetchData}
      />

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        
        <section>
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                Harmonogram
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <OnlineLessonsWidget 
                    meetings={meetings}
                    isTeacher={isTeacher}
                    onOpenDetails={handleOpenDetails}
                    onSchedule={() => setIsScheduleOpen(true)}
                />

                <StationaryLessonsWidget 
                    meetings={meetings}
                    onOpenDetails={handleOpenDetails}
                />
            </div>

            {historyMeetings.length > 0 && (
                <div className="mt-4 flex flex-col items-end">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-muted-foreground hover:text-foreground text-xs gap-2 h-8"
                    >
                        <History className="h-3 w-3" /> 
                        {showHistory ? "Ukryj historię" : `Archiwum spotkań (${historyMeetings.length})`}
                        {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>

                    {showHistory && (
                        <div className="w-full mt-2 space-y-1 bg-muted/30 p-2 rounded-lg border border-dashed text-sm animate-in fade-in slide-in-from-top-2">
                            {historyMeetings.map(m => (
                                <div 
                                    key={m.meeting_id} 
                                    className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors" 
                                    onClick={() => handleOpenDetails(m)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Badge variant="outline" className={cn("text-[10px] h-5 shrink-0", m.status === 'cancelled' ? 'text-destructive border-destructive/30' : 'text-muted-foreground')}>
                                            {m.status === 'cancelled' ? 'Odwołane' : 'Zakończone'}
                                        </Badge>
                                        <span className="text-muted-foreground font-mono text-xs shrink-0">
                                            {format(new Date(m.scheduled_time), "dd.MM.yyyy", { locale: pl })}
                                        </span>
                                        <span className="truncate font-medium text-foreground/80">{m.title}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">
                                        {m.type === 'online' ? 'Online' : 'Stacjonarnie'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>

        <LessonList 
            lessons={lessons} 
            courseId={id!} 
            accentColor={accentColor}
            onRefresh={fetchData}
        />
        
      </div>

      <MeetingDetailsDialog 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); fetchData(); }}
        meeting={selectedMeeting}
        isTeacher={isTeacher}
        onRefresh={fetchData}
      />

      <ScheduleMeetingDialog 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        courses={course ? [course] : []}
        defaultCourseId={course.course_id}
        onSuccess={() => { fetchData(); }}
      />

    </div>
  );
}