import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coursesApi } from "@/api/courses";
import { lessonsApi } from "@/api/Lesson";
import { meetingsApi } from "@/api/meetings";
import { useAuth } from "@/hooks/useAuth";
import { hexToHsl } from "@/lib/colors";
import type { Course } from "@/types/Course";
import type { Lesson } from "@/types/Lesson";
import type { Meeting } from "@/types/Meeting";

import { CourseHeader } from "./components/CourseHeader";
import { LessonList } from "./components/LessonList";
import { MeetingList } from "./components/MeetingList";

export default function DashboardCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const { course: courseData } = await coursesApi.getDetails(id);
      setCourse(courseData);

      const [lessonsData, meetingsData] = await Promise.all([
          lessonsApi.getByCourseId(id),
          meetingsApi.getByCourseId(id)
      ]);

      setLessons(lessonsData);
      setMeetings(meetingsData);
    } catch (error) {
      console.error(error);
      navigate("/dashboard/courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteCourse = async () => {
    if (!id) return;
    if (confirm("Czy na pewno chcesz usunąć ten kurs?")) {
        try {
            await coursesApi.delete(Number(id));
            navigate("/dashboard/courses");
        } catch (error) {
            console.error(error);
            alert("Nie udało się usunąć kursu.");
        }
    }
  };

  if (loading) return <div className="p-8">Ładowanie kursu...</div>;
  if (!course) return null;

  const accentColor = course.color_hex || "hsl(var(--primary))";
  const pageStyles = course.color_hex ? {
    '--primary': hexToHsl(course.color_hex),
    '--ring': hexToHsl(course.color_hex),
  } as React.CSSProperties : {};

  return (
    <div style={pageStyles} className="animate-in fade-in duration-500">
      
      <CourseHeader 
        course={course} 
        isTeacher={isTeacher} 
        onRefresh={fetchData}
        onDelete={handleDeleteCourse}
      />

      <div className="max-w-5xl mx-auto px-4 pb-20">
        
        <MeetingList 
            meetings={meetings} 
            isTeacher={isTeacher} 
            onRefresh={fetchData} 
        />

        <LessonList 
            lessons={lessons} 
            courseId={id!} 
            accentColor={accentColor}
            onRefresh={fetchData}
        />
        
      </div>
    </div>
  );
}