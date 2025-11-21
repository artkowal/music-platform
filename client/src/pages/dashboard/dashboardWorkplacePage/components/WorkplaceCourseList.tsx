import { Briefcase, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCourseDialog } from "@/components/dialogs/CreateCourseDialog";
import { CourseCard } from "../../components/CourseCard";
import type { Course } from "@/types/Course";

interface WorkplaceCourseListProps {
  courses: Course[];
  isTeacher: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onEdit: (course: Course) => void;
  accentColor: string;
}

export function WorkplaceCourseList({ 
  courses, 
  isTeacher, 
  onRefresh, 
  onDelete, 
  onEdit,
  accentColor
}: WorkplaceCourseListProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" style={{ color: accentColor }} />
              Kursy w tej placówce
          </h2>
          
          {isTeacher && (
            <CreateCourseDialog onSuccess={onRefresh}>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Utwórz Kurs
                </Button>
            </CreateCourseDialog>
          )}
      </div>

      {courses.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 border border-dashed rounded-lg animate-in fade-in zoom-in-95">
              <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Brak kursów</h3>
              <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                  Ta placówka nie ma jeszcze żadnych zajęć.
              </p>
              {isTeacher && (
                <CreateCourseDialog onSuccess={onRefresh}>
                    <Button variant="outline">Dodaj pierwszy kurs</Button>
                </CreateCourseDialog>
              )}
           </div>
      ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {courses.map(course => (
                <CourseCard 
                  key={course.course_id}
                  course={course}
                  isTeacher={isTeacher}
                  hideWorkplace={true}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
          </div>
      )}
    </div>
  );
}