import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Users, ArrowRight, MoreVertical, Trash2, Settings, BookOpen } from "lucide-react";
import type { Course } from "@/types/Course"; 

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
  onDelete?: (courseId: number) => void;
  onEdit?: (course: Course) => void;
  hideWorkplace?: boolean;
}

export function CourseCard({ 
  course, 
  isTeacher, 
  onDelete, 
  onEdit, 
  hideWorkplace = false 
}: CourseCardProps) {
  const navigate = useNavigate();
  
  // Logika kolorów
  const accentColor = course.color_hex || "hsl(var(--primary))";
  const isPrivate = !course.color_hex;

  const workplaceBadgeStyle = {
      borderColor: isPrivate ? undefined : accentColor,
      color: isPrivate ? undefined : accentColor,
      backgroundColor: "transparent"
  };

  const typeBadgeStyle = {
      backgroundColor: isPrivate ? undefined : accentColor,
      color: "#FFFFFF",
      borderColor: isPrivate ? undefined : accentColor
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow h-full relative group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-2xl font-bold leading-tight line-clamp-2">
                {course.title}
            </CardTitle>

            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
                <Badge 
                    variant="default" 
                    className="text-[10px] px-2 h-6 font-normal hover:opacity-90 transition-opacity"
                    style={typeBadgeStyle}
                >
                    {course.course_type === 'individual' ? 'Indywidualny' : 'Grupowy'}
                </Badge>

                {isTeacher && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Opcje</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(course)}>
                                <Settings className="mr-2 h-4 w-4" /> Ustawienia kursu
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete?.(course.course_id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Usuń kurs
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>

        {!hideWorkplace && (
            <div className="mt-2 mb-3">
                <Badge 
                    variant="outline" 
                    className="text-[11px] px-2 py-0.5 font-normal rounded-full"
                    style={workplaceBadgeStyle}
                >
                    {course.workplace_name || "Prywatnie"}
                </Badge>
            </div>
        )}

        <CardDescription className={`line-clamp-2 text-sm text-muted-foreground ${hideWorkplace ? 'pt-4' : 'pt-1'}`}>
            {course.description || "Brak opisu kursu."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="mt-auto py-2">
          <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5" title="Liczba uczniów">
                  <Users className="h-4 w-4 opacity-70" /> 
                  <span>{course.student_count}</span>
              </div>

              <div className="flex items-center gap-1.5" title="Liczba lekcji">
                  <BookOpen className="h-4 w-4 opacity-70" />
                  <span>{course.lesson_count || 0}</span>
              </div>
          </div>
          
          {!isTeacher && (
             <div className="mt-1 text-xs text-muted-foreground text-right">
                <span className="font-medium uppercase tracking-wide mr-1">Nauczyciel:</span>
                {course.teacher_name} {course.teacher_lastname}
             </div>
          )}
      </CardContent>

      <CardFooter className="pt-2 pb-6">
          <Button 
              className="w-full text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accentColor }}
              onClick={() => navigate(`/dashboard/courses/${course.course_id}`)}
          >
            Przejdź do kursu <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
      </CardFooter>
    </Card>
  );
}