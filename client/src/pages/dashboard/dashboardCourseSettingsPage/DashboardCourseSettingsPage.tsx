import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/utils";
import { useWorkplace } from "@/context/WorkplaceContext";
import type { Student } from "@/types/Student";

import { CourseSettingsHeader } from "./components/CourseSettingsHeader";
import { CourseEditForm, type CourseData } from "./components/CourseEditForm";
import { StudentManagement } from "./components/StudentManagement";

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

    const fetchData = async () => {
        try {
            const res = await api.get(`/courses/${id}/details`);
            const { course, students } = res.data;
            
            setCourseData({
                title: course.title,
                description: course.description || "",
                course_type: course.course_type,
                workplace_id: course.workplace_id ? course.workplace_id.toString() : "none"
            });
            
            setStudents(students);
        } catch (error) {
            console.error(error);
            navigate('/dashboard/courses'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // HANDLERY
    const handleSaveCourse = async (data: CourseData) => {
        try {
            await api.put(`/courses/${id}`, {
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
        try {
            await api.post(`/courses/${id}/enroll`, { email });
            await fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!confirm("Czy na pewno usunąć tego ucznia z kursu?")) return;
        try {
            await api.delete(`/courses/${id}/students/${studentId}`);
            setStudents(prev => prev.filter(s => s.user_id !== studentId));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8">Ładowanie ustawień...</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] animate-in fade-in">
            
            <CourseSettingsHeader 
                title="Ustawienia kursu" 
                subtitle={`Zarządzaj informacjami o kursie "${courseData.title}"`}
            />

            <div className="p-6 grid gap-6 grid-cols-1 xl:grid-cols-2 items-start">
                
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
        </div>
    );
}