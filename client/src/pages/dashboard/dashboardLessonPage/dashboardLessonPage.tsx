import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonsApi } from "@/api/lessons";
import { coursesApi } from "@/api/courses";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PenLine, Save, Upload, Trash2, Eye, EyeOff } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import type { Course } from "@/types/Course";
import type { Student } from "@/types/Student";

import { LessonHeader } from "./components/LessonHeader";
import { LessonMaterials } from "./components/LessonMaterials";

export default function DashboardLessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    duration: number;
    isVisible: boolean;
  } | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const fetchData = async () => {
    if (!courseId || !lessonId) return;
    try {
        const courseRes = await coursesApi.getDetails(courseId);
        setCourse(courseRes.course);
        setStudents(courseRes.students);

        const allLessons: Lesson[] = await lessonsApi.getByCourseId(courseId);
        const found = allLessons.find((l) => l.lesson_id === Number(lessonId));
        
        if (!found) {
            navigate(`/dashboard/courses/${courseId}`);
            return;
        }
        setLesson(found);
        setEditData({
            title: found.title,
            description: found.description || "",
            duration: found.duration_minutes,
            isVisible: Boolean(found.is_visible) // Widoczność
        });

    } catch (error) {
        console.error(error);
        navigate(`/dashboard/courses/${courseId}`);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const handleSave = async () => {
    if (!lesson || !editData) return;
    try {
        await lessonsApi.update(lesson.lesson_id, {
            title: editData.title,
            description: editData.description,
            duration_minutes: editData.duration,
            is_visible: editData.isVisible,
        });

        if (newFiles.length > 0) {
            const formData = new FormData();
            newFiles.forEach(f => formData.append('files', f));
            await lessonsApi.addMaterials(lesson.lesson_id, formData);
        }

        await fetchData();
        setIsEditing(false);
        setNewFiles([]);
    } catch (error) {
        console.error(error);
        alert("Błąd zapisu zmian");
    }
  };

  const handleDeleteLesson = async () => {
    if (!lesson) return;
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję? Tej operacji nie można cofnąć.")) return;
    
    try {
        await lessonsApi.delete(lesson.lesson_id);
        navigate(`/dashboard/courses/${courseId}`);
    } catch (error) {
        console.error(error);
        alert("Błąd podczas usuwania lekcji");
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!lesson) return;
    if (!confirm("Czy na pewno usunąć ten plik?")) return;
    try {
        await lessonsApi.deleteMaterial(lesson.lesson_id, materialId);
        setLesson(prev => prev ? ({
            ...prev,
            materials: prev.materials?.filter(m => m.material_id !== materialId)
        }) : null);
    } catch (error) {
        console.error(error);
        alert("Błąd usuwania pliku");
    }
  };

  if (loading || !lesson || !course || !editData) return <div className="p-8">Ładowanie lekcji...</div>;

  const accentColor = course.color_hex || "hsl(var(--primary))";

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 animate-in fade-in duration-500">
      
      {isEditing ? (
          <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-6 sticky top-0 z-20 shadow-sm">
             <div className="max-w-5xl mx-auto flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <PenLine className="h-5 w-5 text-primary" /> Edycja lekcji
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setIsEditing(false); setNewFiles([]); }}>
                        Anuluj
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Zapisz zmiany
                    </Button>
                </div>
             </div>
          </div>
      ) : (
          <div className="relative">
             <LessonHeader 
                lesson={lesson}
                course={course}
                students={students}
                isTeacher={isTeacher}
                accentColor={accentColor}
                onEdit={() => setIsEditing(true)}
             />
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        
        {isEditing ? (
            // --- TRYB EDYCJI ---
            <div className="grid gap-6 animate-in zoom-in-95 duration-300">
                
                <Card className="p-6 grid gap-6">
                    <div className="grid gap-2">
                        <Label>Temat lekcji</Label>
                        <Input 
                            value={editData?.title} 
                            onChange={e => setEditData(prev => prev ? ({...prev, title: e.target.value}) : null)}
                            className="font-bold text-lg"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label>Szacowany czas (min)</Label>
                            <Input 
                                type="number"
                                value={editData?.duration}
                                onChange={e => setEditData(prev => prev ? ({...prev, duration: Number(e.target.value)}) : null)}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-muted/20 h-[42px] self-end">
                            <div className="flex items-center gap-2 text-sm">
                                {editData?.isVisible ? (
                                    <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>{editData?.isVisible ? "Widoczna dla uczniów" : "Ukryta (Szkic)"}</span>
                            </div>
                            <Switch 
                                checked={editData?.isVisible}
                                onCheckedChange={(val: boolean) => setEditData(prev => prev ? ({...prev, isVisible: val}) : null)}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 grid gap-2">
                    <Label>Treść / Opis</Label>
                    <Textarea 
                        value={editData?.description}
                        onChange={e => setEditData(prev => prev ? ({...prev, description: e.target.value}) : null)}
                        className="min-h-[300px] font-mono text-sm leading-relaxed"
                    />
                </Card>

                <Card className="p-6">
                    <Label className="mb-4 block">Zarządzaj materiałami</Label>
                    
                    <LessonMaterials 
                        materials={lesson.materials || []} 
                        isEditing={true}
                        onDelete={handleDeleteMaterial}
                    />

                    <div className="border-t pt-4 mt-4">
                        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Dodaj nowe pliki</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="file" 
                                multiple 
                                className="cursor-pointer"
                                onChange={(e) => e.target.files && setNewFiles(Array.from(e.target.files))}
                            />
                        </div>
                        {newFiles.length > 0 && (
                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1 bg-green-50 p-2 rounded border border-green-200">
                                <Upload className="h-3 w-3" /> Gotowe do wysłania: {newFiles.length} plików.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive text-lg">Strefa niebezpieczna</CardTitle>
                        <CardDescription>Tej operacji nie można cofnąć.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteLesson}
                            className="w-full sm:w-auto gap-2"
                        >
                            <Trash2 className="h-4 w-4" /> Usuń tę lekcję
                        </Button>
                    </CardContent>
                </Card>
            </div>
        ) : (
            // --- TRYB PODGLĄDU ---
            <>
                {isTeacher && !lesson.is_visible && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                        <EyeOff className="h-4 w-4" />
                        Ta lekcja jest ukryta dla uczniów.
                    </div>
                )}

                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed bg-card p-6 md:p-8 rounded-xl border shadow-sm">
                    {lesson.description || "Brak opisu dla tej lekcji."}
                </div>

                <LessonMaterials materials={lesson.materials || []} />
            </>
        )}

      </div>
    </div>
  );
}