import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/utils";
import { useWorkplace, type Workplace } from "@/context/WorkplaceContext";
import { useAuth } from "@/hooks/useAuth";
import { hexToHsl } from "@/lib/colors";
import type { Course } from "@/types/Course";

import { WorkplaceHeader } from "./components/WorkplaceHeader";
import { WorkplaceCourseList } from "./components/WorkplaceCourseList";

export default function DashboardWorkplacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveWorkplace } = useWorkplace();
  const { user } = useAuth();
  
  const [workplace, setWorkplace] = useState<Workplace | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeacher = user?.role === 'teacher';

  const fetchData = async () => {
    setLoading(true);
    try {
      const wpRes = await api.get(`/workplaces/${id}`);
      const wpData = wpRes.data.data;
      setWorkplace(wpData);
      setActiveWorkplace(wpData);

      const coursesRes = await api.get("/courses");
      const wpCourses = coursesRes.data.data.filter((c: Course) => c.workplace_id === Number(id));
      setCourses(wpCourses);

    } catch (error) {
      console.error("Błąd pobierania danych", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten kurs bezpowrotnie?")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      fetchData(); 
    } catch (error) {
      console.error(error);
      alert("Błąd podczas usuwania kursu.");
    }
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/dashboard/courses/${course.course_id}/settings`);
  };

  if (loading) return <div className="p-8">Ładowanie placówki...</div>;
  if (!workplace) return <div className="p-8">Nie znaleziono placówki.</div>;

  const totalStudents = courses.reduce((acc, curr) => acc + curr.student_count, 0);

  const pageStyles = {
    '--primary': hexToHsl(workplace.color_hex),
    '--ring': hexToHsl(workplace.color_hex),
  } as React.CSSProperties;

  return (
    <div style={pageStyles} className="animate-in fade-in duration-500">
      
      <WorkplaceHeader 
        workplace={workplace} 
        stats={{ 
            courses: courses.length, 
            students: totalStudents 
        }} 
      />

      <div className="px-1">
        <WorkplaceCourseList 
            courses={courses}
            isTeacher={isTeacher}
            onRefresh={fetchData}
            onDelete={handleDeleteCourse}
            onEdit={handleEditCourse}
            accentColor={workplace.color_hex}
        />
      </div>

    </div>
  );
}