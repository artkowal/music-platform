import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings, 
  GraduationCap 
} from "lucide-react";
import { CreateLessonDialog } from "@/components/dialogs/CreateLessonDialog";
import type { Course } from "@/types/Course";
import { hexToRgba } from "@/lib/colors";

interface CourseHeaderProps {
  course: Course;
  isTeacher: boolean;
  onRefresh: () => void;
  onDelete: () => void;
}

export function CourseHeader({ course, isTeacher, onRefresh }: CourseHeaderProps) {
  const navigate = useNavigate();
  const accentColor = course.color_hex || "hsl(var(--primary))";

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-6">
      <div className="flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard/courses")}
                className="text-muted-foreground hover:text-foreground pl-0 hover:pl-2 transition-all"
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
            </Button>

            {isTeacher && (
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/dashboard/courses/${course.course_id}/settings`)}
                    >
                        <Settings className="mr-2 h-4 w-4" /> Ustawienia
                    </Button>
                </div>
            )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div 
                    className="flex h-14 w-14 items-center justify-center rounded-xl border shadow-sm shrink-0"
                    style={{ 
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        borderColor: hexToRgba(accentColor, 0.2),
                        color: accentColor
                    }}
                >
                    <GraduationCap className="h-7 w-7" />
                </div>
                
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                        <Badge 
                            variant="outline" 
                            style={{ borderColor: accentColor, color: accentColor }}
                        >
                            {course.course_type === 'individual' ? 'Indywidualny' : 'Grupowy'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {course.description || "Brak opisu kursu."}
                    </p>
                </div>
            </div>

            {isTeacher && (
                 <CreateLessonDialog courseId={course.course_id} onSuccess={onRefresh} />
            )}
        </div>
      </div>
    </div>
  );
}