import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Music, Download, Eye, X, Trash2 } from "lucide-react";
import type { Material } from "@/types/Lesson";

interface LessonMaterialsProps {
  materials: Material[];
  isEditing?: boolean; 
  onDelete?: (id: number) => void;
}

const API_URL = "http://localhost:5001";

export function LessonMaterials({ materials, isEditing, onDelete }: LessonMaterialsProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getFileUrl = (path: string) => `${API_URL}/${path}`;

  if ((!materials || materials.length === 0) && !isEditing) return null;

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
          Materiały do lekcji 
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {materials.length}
          </span>
      </h3>

      {previewUrl && (
        <div className="border rounded-lg overflow-hidden bg-background shadow-sm animate-in fade-in slide-in-from-top-2 mb-6">
            <div className="flex justify-between items-center p-3 bg-muted/30 border-b">
                <span className="text-sm font-medium px-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" /> Podgląd pliku
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <iframe 
                src={previewUrl} 
                className="w-full h-[70vh] bg-white" 
                title="Podgląd PDF"
            />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {materials.map((material) => {
          const isAudio = material.file_path.endsWith('.mp3') || material.file_path.endsWith('.wav');
          const isPdf = material.file_path.endsWith('.pdf');
          const fullUrl = getFileUrl(material.file_path);

          return (
            <Card key={material.material_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/50 transition-colors group relative">
                
                <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${isAudio ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isAudio ? <Music className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate" title={material.title}>{material.title}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {material.file_path.split('/').pop()}
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                    {isEditing ? (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => onDelete?.(material.material_id)}
                        >
                            <Trash2 className="h-4 w-4" /> Usuń
                        </Button>
                    ) : (
                        <>
                            {isAudio && (
                                <audio controls className="h-9 w-full sm:w-48 mr-2">
                                    <source src={fullUrl} />
                                </audio>
                            )}

                            {isPdf && (
                                <Button variant="secondary" onClick={() => setPreviewUrl(fullUrl)}>
                                    <Eye className="mr-2 h-4 w-4" /> Podgląd
                                </Button>
                            )}

                            <Button asChild variant="outline">
                                <a href={fullUrl} download>
                                    <Download className="mr-2 h-4 w-4" /> Pobierz
                                </a>
                            </Button>
                        </>
                    )}
                </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}