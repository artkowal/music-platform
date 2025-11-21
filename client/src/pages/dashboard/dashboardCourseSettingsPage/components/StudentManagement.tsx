import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import type { Student } from "@/types/Student";

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (email: string) => Promise<void>;
  onRemoveStudent: (studentId: number) => Promise<void>;
}

export function StudentManagement({ students, onAddStudent, onRemoveStudent }: StudentManagementProps) {
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!newStudentEmail) return;
    setIsLoading(true);
    await onAddStudent(newStudentEmail);
    setNewStudentEmail("");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uczniowie</CardTitle>
        <CardDescription>Zarządzaj listą osób zapisanych na ten kurs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex gap-2 items-end">
          <div className="grid gap-2 flex-1">
            <Label>Dodaj ucznia (email)</Label>
            <Input 
              placeholder="uczen@example.com" 
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleAdd() }}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newStudentEmail || isLoading}>
            <Plus className="mr-2 h-4 w-4" /> Dodaj
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i Nazwisko</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Brak uczniów w tym kursie.
                  </TableCell>
                </TableRow>
              ) : (
                students.map(student => (
                  <TableRow key={student.user_id}>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveStudent(student.user_id)}
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