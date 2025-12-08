import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Layers, ChevronRight, Clock, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CalendarEvent } from "../types";
import { StandardEvent } from "./StandardEvent";

interface MonthEventProps {
  event: CalendarEvent;
  events: CalendarEvent[];
  isTeacher: boolean;
  onSelectEvent: (event: CalendarEvent) => void;
  onGoToDay: (date: Date) => void;
}

export function MonthEvent({ event, events, isTeacher, onSelectEvent, onGoToDay }: MonthEventProps) {
    // Znajdź wszystkie wydarzenia z tego dnia
    const dayEvents = useMemo(() => 
        events.filter(e => isSameDay(e.start, event.start)).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, event.start]);

    const isCrowded = dayEvents.length > 3;

    const isFirst = dayEvents.length > 0 && dayEvents[0].resource.meeting_id === event.resource.meeting_id;
    
    if (isCrowded) {
        if (!isFirst) return null;

        return (
          <div onClick={(e) => e.stopPropagation()} className="h-full">
              <Popover>
                  <PopoverTrigger asChild>
                      <div 
                          className="w-full h-[26px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm group mt-1"
                          title="Kliknij, aby zobaczyć szczegóły"
                      >
                          <span className="text-[11px] font-bold flex items-center gap-1.5">
                              <Layers className="h-3 w-3" />
                              {dayEvents.length} lekcji
                          </span>
                          <ChevronRight className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 shadow-xl border-border/60" align="center" sideOffset={5}>
                      <div className="p-3 border-b bg-muted/40 flex justify-between items-center">
                          <span className="font-semibold text-sm flex items-center gap-2">
                              <span className="w-1 h-4 bg-primary rounded-full"/>
                              {format(event.start, "d MMMM", { locale: pl })}
                          </span>
                          <span className="text-xs text-muted-foreground bg-background border px-2 py-0.5 rounded-full">
                              {dayEvents.length} zajęć
                          </span>
                      </div>
                      
                      <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                          {dayEvents.map(e => {
                              const m = e.resource;
                              const isTimeOff = m.event_type === 'time_off';
                              return (
                                  <div 
                                      key={m.meeting_id} 
                                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 text-sm cursor-pointer transition-colors relative overflow-hidden border border-transparent hover:border-border/60"
                                      onClick={() => {
                                          document.body.click(); 
                                          setTimeout(() => onSelectEvent(e), 50);
                                      }}
                                  >
                                      <div 
                                          className="absolute left-0 top-0 bottom-0 w-1" 
                                          style={{ backgroundColor: isTimeOff ? '#ef4444' : (m.workplace_color || '#2563eb') }} 
                                      />
                                      
                                      <div className="flex-1 min-w-0 pl-1">
                                          <div className="font-medium truncate leading-tight text-foreground/90">{e.title}</div>
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                              <span className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded border border-border/50">
                                                  <Clock className="h-3 w-3 opacity-70"/> 
                                                  {format(e.start, "HH:mm")}
                                              </span>
                                              {!isTimeOff && (
                                                  <span className="flex items-center gap-1 opacity-80">
                                                      {m.type === 'online' ? <Video className="h-3 w-3"/> : <MapPin className="h-3 w-3"/>}
                                                      {m.type === 'online' ? 'Online' : 'Stacjonarnie'}
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>

                      <div className="p-2 border-t bg-muted/20">
                          <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full h-9 text-xs font-medium" 
                              onClick={() => onGoToDay(event.start)}
                          >
                              Zobacz pełny plan dnia <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                      </div>
                  </PopoverContent>
              </Popover>
          </div>
        );
    }

    return <StandardEvent event={event} isTeacher={isTeacher} />;
}