import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Clock, FileText, Eye, EyeOff } from "lucide-react";
import type { Lesson } from "@/types/Lesson";
import { lessonsApi } from "@/api/lessons";

interface LessonsManagementProps {
  lessons: Lesson[];
  onRefresh: () => void;
}

export function LessonsManagement({ lessons, onRefresh }: LessonsManagementProps) {
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const handleToggleVisibility = async (lesson: Lesson) => {
    setIsUpdating(lesson.lesson_id);
    try {
      // jeśli 1 to 0, jeśli 0 to 1
      await lessonsApi.update(lesson.lesson_id, {
        is_visible: !lesson.is_visible
      });
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Błąd aktualizacji widoczności");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (lessonId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję i wszystkie jej materiały?")) return;
    try {
      await lessonsApi.delete(lessonId);
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Błąd usuwania lekcji");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zarządzanie Lekcjami</CardTitle>
        <CardDescription>
          Zarządzaj widocznością i usuwaniem lekcji w tym kursie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Tytuł lekcji</TableHead>
                <TableHead className="hidden sm:table-cell">Czas</TableHead>
                <TableHead>Widoczność</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Brak lekcji w tym kursie.
                  </TableCell>
                </TableRow>
              ) : (
                lessons.map((lesson, index) => (
                  <TableRow key={lesson.lesson_id}>
                    <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 sm:hidden">
                            <Clock className="h-3 w-3" /> {lesson.duration_minutes} min
                        </div>
                        {lesson.materials && lesson.materials.length > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <FileText className="h-3 w-3" /> 
                                {lesson.materials.length} plików
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" /> {lesson.duration_minutes} min
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Switch 
                                checked={Boolean(lesson.is_visible)}
                                onCheckedChange={() => handleToggleVisibility(lesson)}
                                disabled={isUpdating === lesson.lesson_id}
                            />
                            <span className="text-xs text-muted-foreground hidden sm:inline-block w-16">
                                {lesson.is_visible ? "Widoczna" : "Ukryta"}
                            </span>
                            <span className="sm:hidden text-muted-foreground">
                                {lesson.is_visible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(lesson.lesson_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}