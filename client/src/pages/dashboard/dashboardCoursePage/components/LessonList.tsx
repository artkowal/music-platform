import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, FileText, ArrowRight, CheckCircle2, EyeOff, CalendarDays } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import { cn } from "@/lib/utils";

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
  accentColor: string;
}

export function LessonList({ lessons, courseId, accentColor }: LessonListProps) {
  const navigate = useNavigate();

  const formatSecondsToMinutes = (seconds: number) => {
    return Math.round(seconds / 60);
  };

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
                    const isCompleted = Boolean(lesson.progress?.is_completed);
                    const isHidden = !lesson.is_visible;
                    
                    const spentMinutes = lesson.progress?.time_spent_seconds 
                        ? formatSecondsToMinutes(lesson.progress.time_spent_seconds) 
                        : 0;
                    const completedDate = lesson.progress?.completed_at
                        ? new Date(lesson.progress.completed_at).toLocaleDateString()
                        : null;
                    
                    const createdDate = lesson.created_at
                        ? new Date(lesson.created_at).toLocaleDateString()
                        : null;

                    return (
                        <Card 
                            key={lesson.lesson_id} 
                            className={cn(
                                "p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group border",
                                isHidden 
                                    ? "bg-muted/60 border-dashed opacity-80 hover:opacity-100" 
                                    : isCompleted 
                                        ? "border-green-500/50 bg-green-500/5"
                                        : "border-border"
                            )}
                            onClick={() => navigate(`/dashboard/courses/${courseId}/lessons/${lesson.lesson_id}`)}
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div 
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full font-bold shrink-0 transition-colors",
                                        isHidden && "grayscale opacity-50"
                                    )}
                                    style={{ 
                                        backgroundColor: isHidden ? undefined : `${accentColor}20`, 
                                        color: isHidden ? undefined : accentColor
                                    }}
                                >
                                    {index + 1}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                            {lesson.title}
                                        </h3>
                                        {isHidden && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-dashed">
                                                <EyeOff className="h-3 w-3" /> Ukryta
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                        {createdDate && (
                                            <span className="flex items-center gap-1" title="Data dodania">
                                                <CalendarDays className="h-3 w-3" /> {createdDate}
                                            </span>
                                        )}

                                        <span className="flex items-center gap-1" title="Szacowany / Spędzony czas">
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
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 gap-1 border-green-200 pr-3">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                            <span className="font-medium">Ukończono</span>
                                            {completedDate && (
                                                <span className="text-[10px] opacity-80 font-normal">
                                                    {completedDate}
                                                </span>
                                            )}
                                        </div>
                                    </Badge>
                                )}
                                
                                <div className="p-2 rounded-full group-hover:bg-muted transition-colors">
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        )}
    </div>
  );
}