import { useState } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, GripVertical, Pencil, Save, X, Building2 } from "lucide-react";
import type { Workplace } from "@/types/Workplace";

interface Props {
    workplace: Workplace;
    onDelete: (id: number) => void;
    onRename: (id: number, newName: string) => void;
}

export function SortableWorkplaceItem({ workplace, onDelete, onRename }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: workplace.workplace_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(workplace.name);

    const handleSave = () => {
        onRename(workplace.workplace_id, editName);
        setIsEditing(false);
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-3 touch-none">
            <Card className="flex items-center p-3 gap-4 bg-background transition-colors hover:border-primary/50">
                
                <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-2 rounded text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </div>

                <div 
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-white shadow-sm"
                    style={{ backgroundColor: workplace.color_hex }}
                >
                    <Building2 className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-2 max-w-md">
                            <Input 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <Button size="sm" onClick={handleSave}><Save className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-3 w-3" /></Button>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-semibold truncate">{workplace.name}</h4>
                            <p className="text-xs text-muted-foreground">ID: {workplace.workplace_id}</p>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setIsEditing(true)}
                            title="Zmień nazwę"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                            onClick={() => onDelete(workplace.workplace_id)}
                            title="Usuń placówkę"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}