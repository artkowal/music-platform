import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { lessonsApi } from "@/api/Lesson";
import { Plus, Upload, X, Eye, EyeOff } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";

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
  const [isVisible, setIsVisible] = useState(true); // <--- Nowy stan
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
      formData.append("is_visible", String(isVisible));

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await lessonsApi.create(formData);

      setTitle("");
      setDescription("");
      setDuration("45");
      setIsVisible(true);
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
            <Plus className="mr-2 h-4 w-4" /> Dodaj materiały
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nowy materiał / lekcja</DialogTitle>
          <DialogDescription>
            Dodaj pliki i opis dla swoich uczniów.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="title">Temat</Label>
            <Input
              id="title"
              placeholder="np. Wstęp do akordów"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Opis / Zadania</Label>
            
            {/* Nowy Edytor */}
            <RichTextEditor 
                value={description}
                onChange={setDescription}
                height={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="duration">Czas (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
             </div>
             
             {/* Sekcja widoczności - Switch */}
             <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between border rounded-md p-2 px-3 bg-muted/30 h-10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isVisible ? <Eye className="h-4 w-4 text-green-600"/> : <EyeOff className="h-4 w-4"/>}
                        <span>{isVisible ? "Widoczna" : "Ukryta (Szkic)"}</span>
                    </div>
                    <Switch 
                        checked={isVisible} 
                        onCheckedChange={setIsVisible} 
                        className="scale-75 origin-right"
                    />
                </div>
             </div>
          </div>

          <div className="grid gap-2">
            <Label>Materiały (PDF, Audio, Obrazy)</Label>
            <div className="flex items-center gap-2">
                <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.mp3,.wav,.jpg,.png,.doc,.docx"
                />
                <Button type="button" variant="secondary" onClick={() => document.getElementById('file-upload')?.click()} className="w-full border-dashed border-2 bg-muted/20 hover:bg-muted/40">
                    <Upload className="mr-2 h-4 w-4" /> Wybierz pliki z dysku
                </Button>
            </div>
            
            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2 max-h-[120px] overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded border border-border">
                            <span className="truncate max-w-[85%]">{file.name}</span>
                            <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title}>
            {isSubmitting ? "Zapisywanie..." : "Utwórz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}