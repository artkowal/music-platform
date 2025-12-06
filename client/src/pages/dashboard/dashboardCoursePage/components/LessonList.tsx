import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, FileText, ArrowRight, CheckCircle2, CalendarDays, Video, Lock, MapPin, XCircle, AlertCircle } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import { cn } from "@/lib/utils";
import { format, isFuture } from "date-fns";
import { pl } from "date-fns/locale";
import { LessonDetailsDialog } from "@/components/dialogs/LessonDetailsDialog";
import { lessonsApi } from "@/api/lessons";
import { useAuth } from "@/hooks/useAuth";

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
  accentColor: string;
  onRefresh: () => void;
}

export function LessonList({ lessons, courseId, accentColor, onRefresh }: LessonListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDetails = (lesson: Lesson) => {
      setSelectedLesson(lesson);
      setIsDialogOpen(true);
  };

  const handleDeleteLesson = async (id: number) => {
      try {
          await lessonsApi.delete(id);
          setIsDialogOpen(false);
          onRefresh();
      } catch (error) {
          console.error(error);
          alert("Nie udało się usunąć lekcji.");
      }
  };

  const formatSecondsToMinutes = (seconds: number) => Math.round(seconds / 60);

  return (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: accentColor }} /> 
            Plan Lekcji
        </h2>

        {lessons.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Ten kurs nie ma jeszcze żadnych lekcji.</p>
            </div>
        ) : (
            <div className="grid gap-3">
                {lessons.map((lesson, index) => {
                    
                    if (lesson.scheduled_time) {
                        const isOnline = lesson.lesson_type === 'online';
                        const scheduledDate = new Date(lesson.scheduled_time);
                        const isLessonFuture = isFuture(scheduledDate);
                        const displayDate = format(scheduledDate, "d MMMM yyyy, HH:mm", { locale: pl });

                        const isCancelled = lesson.status === 'cancelled';
            
                        const isPhysicallyFinished = Boolean(lesson.is_ended_early) || (!isLessonFuture && !isCancelled);
                        const isFullyCompleted = lesson.status === 'completed' || (lesson.is_confirmed_by_teacher && lesson.is_confirmed_by_student);
                        const isWaitingForStudent = !isTeacher && isPhysicallyFinished && !lesson.is_confirmed_by_student && !isCancelled && !isFullyCompleted;

                        // Style kafelka
                        let borderClass = isOnline ? "border-blue-500" : "border-orange-500";
                        let bgClass = isOnline ? "bg-blue-50/30" : "bg-orange-50/30";
                        let opacityClass = "";

                        if (isCancelled) {
                            borderClass = "border-red-500";
                            bgClass = "bg-red-50/30";
                            opacityClass = "opacity-70 grayscale-[0.2]";
                        } else if (isFullyCompleted) {
                            borderClass = "border-green-500";
                            bgClass = "bg-muted/40";
                            opacityClass = "opacity-60 grayscale-[0.5]";
                        } else if (isWaitingForStudent) {
                            borderClass = "border-yellow-500 animate-pulse"; 
                            bgClass = "bg-yellow-50/50";
                        }

                        return (
                            <Card 
                                key={lesson.lesson_id} 
                                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-all hover:shadow-sm cursor-pointer border-l-4 ${borderClass} ${bgClass} ${opacityClass}`}
                                onClick={() => handleOpenDetails(lesson)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                                        isCancelled ? "bg-red-100 text-red-600" :
                                        isFullyCompleted ? "bg-green-100 text-green-600" :
                                        isWaitingForStudent ? "bg-yellow-100 text-yellow-600" :
                                        isOnline ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                    )}>
                                        {isCancelled ? <XCircle className="h-5 w-5" /> :
                                         isFullyCompleted ? <CheckCircle2 className="h-5 w-5" /> :
                                         isWaitingForStudent ? <AlertCircle className="h-5 w-5" /> :
                                         isOnline ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                                    </div>

                                    <div>
                                        <h3 className={cn("font-semibold flex items-center gap-2", (isCancelled || isFullyCompleted) && "text-muted-foreground")}>
                                            {lesson.title}
                                            <Badge variant="outline" className="text-[10px] h-5 font-normal">
                                                {isOnline ? "Online" : "Stacjonarna"}
                                            </Badge>
                                        </h3>
                                        <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1.5">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarDays className="h-3.5 w-3.5" /> {displayDate}
                                            </span>
                                            
                                            {isCancelled ? (
                                                <span className="flex items-center gap-1.5 text-red-600 font-medium text-xs bg-red-50 px-2 rounded border border-red-100">
                                                    Odwołana ({lesson.cancelled_by === 'teacher' ? 'Nauczyciel' : 'Uczeń'})
                                                </span>
                                            ) : isFullyCompleted ? (
                                                <span className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Odbyta (Potwierdzona)
                                                </span>
                                            ) : isWaitingForStudent ? (
                                                <span className="flex items-center gap-1.5 text-yellow-700 font-bold text-xs bg-yellow-100 px-2 rounded border border-yellow-200">
                                                    <AlertCircle className="h-3.5 w-3.5" /> Wymaga Twojego potwierdzenia
                                                </span>
                                            ) : (
                                                // Zaplanowana
                                                <span className="flex items-center gap-1.5 text-orange-600 font-medium text-xs bg-orange-50 px-2 rounded border border-orange-100">
                                                    <Lock className="h-3 w-3" /> Zaplanowana
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 sm:mt-0 text-right">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                                        Szczegóły <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    }

                    const isCompleted = Boolean(lesson.progress?.is_completed);
                    const spentMinutes = lesson.progress?.time_spent_seconds 
                        ? formatSecondsToMinutes(lesson.progress.time_spent_seconds) 
                        : 0;
                    const createdDate = lesson.created_at
                        ? new Date(lesson.created_at).toLocaleDateString()
                        : null;

                    return (
                        <Card 
                            key={lesson.lesson_id} 
                            className="p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group border border-border"
                            onClick={() => navigate(`/dashboard/courses/${courseId}/lessons/${lesson.lesson_id}`)}
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div 
                                    className="flex h-10 w-10 items-center justify-center rounded-full font-bold shrink-0 transition-colors"
                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                >
                                    {index + 1}
                                </div>

                                <div className="min-w-0">
                                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                        {lesson.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                        {createdDate && (
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" /> {createdDate}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> 
                                            <span>{lesson.duration_minutes} min</span>
                                            {spentMinutes > 0 && (
                                                <span className={isCompleted ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                                     {" / "}{spentMinutes} min
                                                </span>
                                            )}
                                        </span>
                                        {lesson.materials && lesson.materials.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> {lesson.materials.length} plików
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-2 shrink-0">
                                {isCompleted && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Ukończono
                                    </Badge>
                                )}
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            </div>
                        </Card>
                    );
                })}
            </div>
        )}

        <LessonDetailsDialog 
            isOpen={isDialogOpen}
            onClose={() => { setIsDialogOpen(false); onRefresh(); }} 
            lesson={selectedLesson}
            isTeacher={isTeacher}
            onDelete={handleDeleteLesson}
            accentColor={accentColor}
        />
    </div>
  );
}