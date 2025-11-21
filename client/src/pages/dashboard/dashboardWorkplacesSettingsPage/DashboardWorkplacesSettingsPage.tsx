import { useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { useWorkplace, type Workplace } from "@/context/WorkplaceContext";
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

import { WorkplacesHeader } from "./components/WorkplacesHeader";
import { WorkplacesList } from "./components/WorkplacesList";

export default function DashboardWorkplacesSettingsPage() {
  const { workplaces, refreshWorkplaces } = useWorkplace();
  const [localWorkplaces, setLocalWorkplaces] = useState<Workplace[]>([]);

  useEffect(() => {
    setLocalWorkplaces(workplaces);
  }, [workplaces]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localWorkplaces.findIndex((item) => item.workplace_id === active.id);
      const newIndex = localWorkplaces.findIndex((item) => item.workplace_id === over.id);
      
      const newItems = arrayMove(localWorkplaces, oldIndex, newIndex);
      setLocalWorkplaces(newItems);
      
      const payload = newItems.map((item, index) => ({
          workplace_id: item.workplace_id,
          sort_order: index
      }));
      try {
          await api.put('/workplaces/reorder/all', { items: payload });
          await refreshWorkplaces();
      } catch (error) {
          console.error("Błąd zapisu kolejności", error);
      }
    }
  };

  const handleDeleteWorkplace = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę placówkę? Kursy zostaną 'Prywatne'.")) return;
    try {
      await api.delete(`/workplaces/${id}`);
      await refreshWorkplaces();
    } catch {
      alert("Błąd usuwania placówki");
    }
  };

  const handleRenameWorkplace = async (id: number, newName: string) => {
      try {
          await api.put(`/workplaces/${id}`, { name: newName });
          await refreshWorkplaces(); 
      } catch {
          alert("Błąd zmiany nazwy");
      }
  };

  return (
    <div className="animate-in fade-in">
      <WorkplacesHeader />
      
      <div className="px-1">
        <WorkplacesList 
            workplaces={localWorkplaces}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteWorkplace}
            onRename={handleRenameWorkplace}
        />
      </div>
    </div>
  );
}