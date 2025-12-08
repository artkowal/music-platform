import { Ban, Pencil } from "lucide-react";
import type { CalendarEvent } from "../types";

interface StandardEventProps {
  event: CalendarEvent;
  isTeacher: boolean;
}

export function StandardEvent({ event, isTeacher }: StandardEventProps) {
  const isTimeOff = event.resource.event_type === 'time_off';

  if (isTimeOff) {
    return (
      <div className="flex items-center justify-between h-full w-full pl-1 pr-0.5 py-0.5 gap-2 overflow-hidden">
         <div className="flex items-center gap-1.5 overflow-hidden text-destructive min-w-0">
              <Ban className="h-3.5 w-3.5 shrink-0" />
              <span className="font-bold text-[10px] uppercase tracking-wider truncate">
                  {event.title !== "Niedostępny" ? event.title : "Niedostępny"}
              </span>
         </div>
         {isTeacher && (
             <div className="flex items-center justify-center bg-destructive text-white rounded shadow-sm hover:bg-destructive/90 transition-colors h-5 w-5 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100">
                 <Pencil className="h-3 w-3" />
             </div>
         )}
      </div>
    );
  }
  
  return (
      <div className="text-xs font-medium truncate px-1">
          {event.title}
      </div>
  );
}