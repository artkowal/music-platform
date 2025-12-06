import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DashboardData } from "@/types/Dashboard";

interface Props {
  lessons: DashboardData['lessonsToComplete'];
}

export function LessonsToComplete({ lessons }: Props) {
  const navigate = useNavigate();
  
  // Obsługa przypadku gdy lessons jest undefined (np. dla nauczyciela)
  const list = lessons || [];

  return (
    <Card className="h-full flex flex-col shadow-sm border-orange-200 bg-orange-50/30 dark:bg-orange-900/10">
        <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-orange-600" /> Do wykonania
                {list.length > 0 && (
                    <span className="ml-auto text-xs font-normal bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                        {list.length} zaległych
                    </span>
                )}
            </CardTitle>
            <CardDescription>
                Lekcje i materiały, których jeszcze nie oznaczyłeś jako ukończone.
            </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto pr-2">
            {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-70">
                    <CheckCircle2 className="h-10 w-10 mb-2 text-green-500" />
                    <p className="text-sm font-medium">Wszystko zrobione!</p>
                    <p className="text-xs">Jesteś na bieżąco z materiałem.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {list.map((lesson) => (
                        <div 
                            key={lesson.lesson_id} 
                            className="group flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                        >
                            <div className="min-w-0 mr-3">
                                <p className="font-semibold text-sm truncate text-foreground">
                                    {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="truncate max-w-[120px] text-orange-700/80 font-medium">
                                        {lesson.course_title}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {lesson.duration_minutes} min
                                    </span>
                                </div>
                            </div>

                            <Button 
                                size="sm" 
                                className="shrink-0 h-8 text-xs gap-1 bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={() => navigate(`/dashboard/courses/${lesson.course_id}/lessons/${lesson.lesson_id}`)}
                            >
                                Przejdź <ArrowRight className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
}