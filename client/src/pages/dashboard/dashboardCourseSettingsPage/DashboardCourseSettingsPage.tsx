import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coursesApi } from "@/api/courses";
import { lessonsApi } from "@/api/lessons";
import { useWorkplace } from "@/context/WorkplaceContext";
import type { Student } from "@/types/Student";
import type { CourseData } from "@/types/Course";
import type { Lesson } from "@/types/Lesson";

import { CourseSettingsHeader } from "./components/CourseSettingsHeader";
import { CourseEditForm } from "./components/CourseEditForm";
import { StudentManagement } from "./components/StudentManagement";
import { LessonsManagement } from "./components/LessonsManagement";

export default function DashboardCourseSettingsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { workplaces } = useWorkplace();
    
    const [loading, setLoading] = useState(true);
    
    const [courseData, setCourseData] = useState<CourseData>({
        title: "",
        description: "",
        course_type: "individual",
        workplace_id: "none"
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const fetchData = async () => {
        if (!id) return;
        try {
            const [courseRes, lessonsRes] = await Promise.all([
                coursesApi.getDetails(id),
                lessonsApi.getByCourseId(id)
            ]);
            
            const { course, students } = courseRes;
            
            setCourseData({
                title: course.title,
                description: course.description || "",
                course_type: course.course_type,
                workplace_id: course.workplace_id ? course.workplace_id.toString() : "none"
            });
            
            setStudents(students);
            setLessons(lessonsRes);

        } catch (error) {
            console.error(error);
            navigate('/dashboard/courses'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // HANDLERY
    const handleSaveCourse = async (data: CourseData) => {
        if (!id) return;
        try {
            await coursesApi.update(id, {
                title: data.title,
                description: data.description,
                course_type: data.course_type,
                workplace_id: data.workplace_id === "none" ? null : Number(data.workplace_id)
            });
            setCourseData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddStudent = async (email: string) => {
        if (!id) return;
        try {
            await coursesApi.enrollStudent(id, email);
            await fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!id) return;
        if (!confirm("Czy na pewno usunąć tego ucznia z kursu?")) return;
        try {
            await coursesApi.removeStudent(id, studentId);
            setStudents(prev => prev.filter(s => s.user_id !== studentId));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8">Ładowanie ustawień...</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] animate-in fade-in pb-10">
            
            <CourseSettingsHeader 
                title="Ustawienia kursu" 
                subtitle={`Zarządzaj informacjami o kursie "${courseData.title}"`}
            />

            <div className="p-6 space-y-8">
                
                <div className="grid gap-8 grid-cols-1 xl:grid-cols-2 items-start">
                    <CourseEditForm 
                        initialData={courseData} 
                        workplaces={workplaces} 
                        onSave={handleSaveCourse} 
                    />

                    <StudentManagement 
                        students={students}
                        onAddStudent={handleAddStudent}
                        onRemoveStudent={handleRemoveStudent}
                    />
                </div>

                <LessonsManagement 
                    lessons={lessons} 
                    onRefresh={fetchData} 
                />

            </div>
        </div>
    );
}