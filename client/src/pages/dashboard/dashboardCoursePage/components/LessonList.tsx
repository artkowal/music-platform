import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Lesson } from "@/types/Lesson";

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
  accentColor: string;
  onRefresh: () => void;
}

export function LessonList({ lessons, courseId, accentColor }: LessonListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: accentColor }} /> 
            Materiały dydaktyczne
        </h2>

        {lessons.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Ten kurs nie ma jeszcze żadnych materiałów.</p>
            </div>
        ) : (
            <div className="grid gap-3">
                {lessons.map((lesson, index) => {
                    if (!lesson.is_visible) return null;

                    const isCompleted = Boolean(lesson.progress?.is_completed);
                    const fileCount = lesson.materials?.length || 0;

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
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        {fileCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> {fileCount} plików
                                            </span>
                                        )}
                                        {lesson.description && (
                                            <span className="truncate max-w-[200px]">{lesson.description}</span>
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
    </div>
  );
}