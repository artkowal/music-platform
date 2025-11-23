import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Clock, GraduationCap, Users, BookOpen, Layers, CheckCircle2, PenLine, CalendarDays } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import type { Course } from "@/types/Course";
import type { Student } from "@/types/Student";
import { LessonTimerMinimal } from "./LessonTimer";
import { hexToRgba } from "@/lib/colors";

interface LessonHeaderProps {
  lesson: Lesson;
  course: Course;
  students: Student[];
  isTeacher: boolean;
  accentColor: string;
  onEdit: () => void;
}

export function LessonHeader({ lesson, course, students, isTeacher, accentColor, onEdit }: LessonHeaderProps) {
  const navigate = useNavigate();

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m} min ${s < 10 ? '0'+s : s} s`;
  };

  const isLessonCompleted = Boolean(lesson.progress?.is_completed);
  const timeSpent = lesson.progress?.time_spent_seconds || 0;
  const completedDate = lesson.progress?.completed_at 
    ? new Date(lesson.progress.completed_at).toLocaleDateString() 
    : null;

  const createdDate = lesson.created_at 
    ? new Date(lesson.created_at).toLocaleDateString()
    : null;

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
      
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="px-6 py-4 flex flex-col gap-5">
        
        <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/dashboard/courses/${course.course_id}`)}
                className="text-muted-foreground hover:text-foreground pl-0 -ml-2 gap-1"
            >
                <ArrowLeft className="h-4 w-4" /> 
                <span className="hidden sm:inline">Wróć do kursu</span>
            </Button>

            <div className="flex items-center gap-3">
                {isTeacher && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onEdit}
                        className="h-8 gap-2 border-dashed hover:border-solid transition-all"
                    >
                        <PenLine className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Edytuj treść</span>
                    </Button>
                )}

                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[150px] sm:max-w-xs">{course.title}</span>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <div 
                    className="flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm shrink-0 mt-1"
                    style={{ 
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        borderColor: hexToRgba(accentColor, 0.2),
                        color: accentColor
                    }}
                >
                    <BookOpen className="h-6 w-6" />
                </div>
                
                <div>
                    <h1 className="text-2xl font-bold tracking-tight leading-tight">{lesson.title}</h1>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        {createdDate && (
                            <span className="flex items-center gap-1.5" title="Data dodania lekcji">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {createdDate}
                            </span>
                        )}

                        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />

                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Szacowany czas: <strong className="text-foreground">{lesson.duration_minutes} min</strong></span>
                        </span>
                        
                        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />

                        {isTeacher ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group">
                                        <Users className="h-3.5 w-3.5 group-hover:text-primary" />
                                        <span>Uczniowie: <span className="font-medium text-foreground">{students.length}</span></span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-60 p-0">
                                    <div className="p-3 border-b bg-muted/20 font-medium text-xs">Zapisani uczniowie</div>
                                    <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                                        {students.map(s => (
                                            <div key={s.user_id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                    {s.first_name[0]}{s.last_name[0]}
                                                </div>
                                                <span>{s.first_name} {s.last_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5" />
                                <span>Prowadzący: <span className="font-medium text-foreground">{course.teacher_name} {course.teacher_lastname}</span></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
                {!isTeacher ? (
                    <LessonTimerMinimal 
                        lessonId={lesson.lesson_id}
                        initialTime={timeSpent}
                        isCompletedInitial={isLessonCompleted}
                        accentColor={accentColor}
                    />
                ) : (
                    <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-sm">
                        {isLessonCompleted ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Ukończono</span>
                                    </div>
                                    {completedDate && (
                                        <span className="text-xs text-muted-foreground pl-6">
                                            {completedDate}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="h-8 w-px bg-border" />
                                
                                <div className="flex flex-col items-end text-sm">
                                    <span className="text-xs text-muted-foreground">Czas ucznia</span>
                                    <div className="font-mono font-medium text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        {formatTime(timeSpent)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4 opacity-50" />
                                Lekcja jeszcze nie ukończona
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}