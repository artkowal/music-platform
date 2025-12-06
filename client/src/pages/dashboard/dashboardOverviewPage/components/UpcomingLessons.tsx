import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, ArrowRight, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import type { DashboardData } from "@/types/Dashboard";
import { Badge } from "@/components/ui/badge";

interface Props {
  lessons: DashboardData['upcomingLessons'];
  isTeacher: boolean;
}

export function UpcomingLessons({ lessons, isTeacher }: Props) {
  const navigate = useNavigate();

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Dzisiaj";
    if (isTomorrow(date)) return "Jutro";
    return format(date, "d MMM", { locale: pl });
  };

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm h-full">
        <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="h-5 w-5 text-primary" /> Nadchodzące zajęcia
        </CardTitle>
        <CardDescription>
            {lessons.length > 0 
                ? `Masz ${lessons.length} zaplanowanych lekcji w najbliższym czasie.` 
                : "Brak zaplanowanych lekcji na najbliższe dni."}
        </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            {lessons.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                    Twój grafik jest pusty.
                    <br/>
                    <Button variant="link" onClick={() => navigate('/dashboard/calendar')}>
                        Przejdź do kalendarza
                    </Button>
                </div>
            )}

            {lessons.map((lesson) => {
                const isOnline = lesson.lesson_type === 'online';
                const date = new Date(lesson.scheduled_time);
                const time = format(date, "HH:mm");

                return (
                <div key={lesson.lesson_id} className="flex items-center justify-between bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm transition-all hover:border-primary/40">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-background border p-2 rounded-md text-center min-w-[60px] shrink-0">
                            <span className="block text-[10px] text-muted-foreground uppercase font-bold">
                                {formatDateLabel(lesson.scheduled_time)}
                            </span>
                            <span className="block text-lg font-bold text-foreground leading-none mt-0.5">
                                {time}
                            </span>
                        </div>
                        
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate flex items-center gap-2">
                                {lesson.title}
                            </p>
                            <div className="text-xs text-muted-foreground truncate flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="font-medium text-primary">{lesson.course_title}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>
                                    {isTeacher 
                                        ? (lesson.workplace_name || "Lekcja prywatna") 
                                        : `${lesson.teacher_name} ${lesson.teacher_lastname}`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 ml-2">
                        {isOnline ? (
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-3 text-xs border hover:bg-primary/10"
                                onClick={() => navigate(`/dashboard/courses/${lesson.course_id}`)}
                            >
                                <Video className="h-3 w-3 mr-1.5 text-blue-500" /> Do kursu
                            </Button>
                        ) : (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" /> Stacjonarnie
                            </Badge>
                        )}
                    </div>
                </div>
                );
            })}

            {lessons.length > 0 && (
                <Button variant="ghost" className="w-full text-xs mt-2" onClick={() => navigate('/dashboard/calendar')}>
                    Zobacz pełny kalendarz <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
            )}
        </CardContent>
    </Card>
  );
}