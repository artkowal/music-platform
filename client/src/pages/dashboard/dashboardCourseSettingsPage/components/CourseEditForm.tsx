import { useState, useEffect, type ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Workplace } from "@/types/Workplace";
import type { CourseData } from "@/types/Course";

interface CourseEditFormProps {
  initialData: CourseData;
  workplaces: Workplace[];
  onSave: (data: CourseData) => Promise<void>;
}

export function CourseEditForm({ initialData, workplaces, onSave }: CourseEditFormProps) {
  const [formData, setFormData] = useState<CourseData>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o kursie</CardTitle>
        <CardDescription>Edytuj nazwę, opis i przypisanie do placówki.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid gap-2">
          <Label>Nazwa kursu</Label>
          <Input 
            value={formData.title} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} 
          />
        </div>
        
        <div className="grid gap-2">
          <Label>Opis</Label>
          <Textarea 
            value={formData.description} 
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Krótki opis kursu..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Typ kursu</Label>
            <Select 
              value={formData.course_type} 
              onValueChange={(val: string) => setFormData({ ...formData, course_type: val })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Indywidualny</SelectItem>
                <SelectItem value="group">Grupowy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Placówka</Label>
            <Select 
              value={formData.workplace_id} 
              onValueChange={(val: string) => setFormData({ ...formData, workplace_id: val })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Prywatnie --</SelectItem>
                {workplaces.map(wp => (
                  <SelectItem key={wp.workplace_id} value={wp.workplace_id.toString()}>
                    {wp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" /> 
            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}