import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/api/courses";
import { useWorkplace } from "@/context/WorkplaceContext";
import { useAuth } from "@/hooks/useAuth";
import { AllCoursesHeader } from "./components/AllCoursesHeader";
import { CourseCard } from "../components/CourseCard"; 
import type { Course } from "@/types/Course";

export default function DashboardAllCoursesPage() {
  const { setActiveWorkplace } = useWorkplace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      console.error("Błąd pobierania kursów", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveWorkplace(null);
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten kurs bezpowrotnie?")) return;
    try {
        await coursesApi.delete(courseId);
        await fetchCourses();
    } catch (error) {
        console.error(error);
        alert("Błąd podczas usuwania kursu.");
    }
  };

  const handleEditCourse = (course: Course) => {
      navigate(`/dashboard/courses/${course.course_id}/settings`);
  };

  if (loading) {
    return <div className="p-8">Ładowanie wszystkich kursów...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AllCoursesHeader count={courses.length} isTeacher={user?.role === 'teacher'} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard 
            key={course.course_id} 
            course={course} 
            isTeacher={user?.role === 'teacher'} 
            onDelete={handleDeleteCourse}
            onEdit={handleEditCourse}
          />
        ))}
      </div>
      
      {courses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            Nie znaleziono żadnych kursów.
        </div>
      )}
    </div>
  );
}