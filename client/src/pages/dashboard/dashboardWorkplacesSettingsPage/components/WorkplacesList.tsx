import { useState } from "react";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { CreateWorkplaceDialog } from "@/components/dialogs/CreateWorkplaceDialog";
import { Plus, School } from "lucide-react";
import type { Workplace } from "@/types/Workplace";
import { SortableWorkplaceItem } from "./SortableWorkplaceItem";

interface Props {
    workplaces: Workplace[];
    onDragEnd: (event: DragEndEvent) => void;
    onDelete: (id: number) => void;
    onRename: (id: number, newName: string) => void;
}

export function WorkplacesList({ workplaces, onDragEnd, onDelete, onRename }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="flex justify-end">
                <CreateWorkplaceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Dodaj Nową
                    </Button>
                </CreateWorkplaceDialog>
            </div>

            {workplaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-lg border border-dashed animate-in fade-in zoom-in-95">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <School className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Brak placówek</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Dodaj swoją pierwszą szkołę, aby zacząć organizować kursy.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsCreateOpen(true)}>
                        Dodaj pierwszą placówkę
                    </Button>
                </div>
            ) : (
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={onDragEnd}
                >
                    <SortableContext 
                        items={workplaces.map(w => w.workplace_id)} 
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {workplaces.map((wp) => (
                                <SortableWorkplaceItem 
                                    key={wp.workplace_id} 
                                    workplace={wp} 
                                    onDelete={onDelete}
                                    onRename={onRename}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}