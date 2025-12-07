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
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Users, User, ArrowRight, MoreVertical, Trash2, Settings, BookOpen, Copy } from "lucide-react";
import type { Course } from "@/types/Course"; 
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  const accentColor = course.color_hex || "hsl(var(--primary))";
  const isPrivate = !course.color_hex;

  const workplaceBadgeStyle = {
      borderColor: isPrivate ? undefined : accentColor,
      color: isPrivate ? undefined : accentColor,
      backgroundColor: "transparent"
  };

  const typeIconStyle = {
      backgroundColor: isPrivate ? undefined : accentColor,
      color: "#FFFFFF",
      borderColor: isPrivate ? undefined : accentColor
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (course.invite_code) {
      navigator.clipboard.writeText(course.invite_code);
      toast({
        title: "Skopiowano!",
        description: `Kod zaproszenia: ${course.invite_code}`,
        variant: "success",
      });
    } else {
      toast({
        title: "Błąd",
        description: "Ten kurs nie posiada kodu zaproszenia.",
        variant: "destructive",
      });
    }
  };

  const isIndividual = course.course_type === 'individual';

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow h-full relative group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
            
            <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl font-bold leading-tight line-clamp-2 break-words hyphens-auto">
                    {course.title}
                </CardTitle>
            </div>

            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div 
                          className="flex items-center justify-center w-6 h-6 rounded-full shadow-sm cursor-help transition-transform hover:scale-105"
                          style={typeIconStyle}
                      >
                          {isIndividual ? <User className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isIndividual ? "Kurs Indywidualny" : "Kurs Grupowy"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {isTeacher && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Opcje</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleCopyCode}>
                                <Copy className="mr-2 h-4 w-4" /> Kopiuj kod zaproszenia
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                    className="text-[11px] px-2 py-0.5 font-normal rounded-full max-w-full truncate inline-block"
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
             <div className="mt-1 text-xs text-muted-foreground text-right truncate">
                <span className="font-medium uppercase tracking-wide mr-1">Nauczyciel:</span>
                {course.teacher_name} {course.teacher_lastname}
             </div>
          )}
      </CardContent>

      <CardFooter className="pt-2 pb-6">
          <Button 
              className="w-full text-white font-medium shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
              onClick={() => navigate(`/dashboard/courses/${course.course_id}`)}
          >
            Przejdź do kursu <ArrowRight className="h-4 w-4"/>
          </Button>
      </CardFooter>
    </Card>
  );
}