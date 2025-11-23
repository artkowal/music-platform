import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { lessonsApi } from "@/api/lessons";
import { Plus, Upload, X } from "lucide-react";

interface Props {
  courseId: number;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateLessonDialog({ courseId, children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("45");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("course_id", courseId.toString());
      formData.append("title", title);
      formData.append("description", description);
      formData.append("duration_minutes", duration);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await lessonsApi.create(formData);

      setTitle("");
      setDescription("");
      setDuration("45");
      setSelectedFiles([]);
      setOpen(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert("Błąd podczas tworzenia lekcji.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Dodaj lekcję
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nowa lekcja</DialogTitle>
          <DialogDescription>
            Dodaj materiały i opis dla swoich uczniów.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Temat lekcji</Label>
            <Input
              id="title"
              placeholder="np. Wstęp do akordów"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Opis / Zadania</Label>
            <Textarea
              id="desc"
              placeholder="Opisz co będzie na lekcji lub co jest zadane..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Szacowany czas (minuty)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Materiały (PDF, Audio)</Label>
            <div className="flex items-center gap-2">
                <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.mp3,.wav,.jpg,.png,.doc,.docx"
                />
                <Button type="button" variant="secondary" onClick={() => document.getElementById('file-upload')?.click()} className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Wybierz pliki
                </Button>
            </div>
            
            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2 max-h-[100px] overflow-y-auto p-2 border rounded bg-muted/30">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                            <span className="truncate max-w-[80%]">{file.name}</span>
                            <button onClick={() => removeFile(idx)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title}>
            {isSubmitting ? "Zapisywanie..." : "Utwórz lekcję"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}