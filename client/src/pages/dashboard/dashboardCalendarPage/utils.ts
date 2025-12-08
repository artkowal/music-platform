import type { CalendarEvent } from "./types";
import { Views } from "react-big-calendar";
import { isSameDay, isWithinInterval } from "date-fns";

export const getEventStyles = (
    event: CalendarEvent, 
    view: string, 
    events: CalendarEvent[], 
    isTeacher: boolean
) => {
    const resource = event.resource;
    const isTimeOff = resource.event_type === 'time_off';

    // LOGIKA DLA WIDOKU MIESIĄCA (Grupowanie > 3 eventów)
    if (view === Views.MONTH) {
        const dayEvents = events.filter(e => isSameDay(e.start, event.start));
        
        if (dayEvents.length > 3) {
            dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
            const isFirst = dayEvents[0].resource.meeting_id === resource.meeting_id;
            
            if (isFirst) {
                return {
                    style: {
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0',
                        boxShadow: 'none',
                        overflow: 'visible',
                    }
                };
            } else {
                return { style: { display: 'none' } };
            }
        }
    }

    // --- STANDARDOWE STYLE ---

    if (isTimeOff) {
        return {
            style: {
                backgroundColor: 'hsl(var(--background))', 
                color: 'hsl(var(--destructive))',          
                border: '1px solid hsl(var(--destructive))', 
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: isTeacher ? 'pointer' : 'not-allowed',
                padding: '0px',
                overflow: 'hidden'
            }
        };
    }

    const meeting = resource;
    const isPast = event.end < new Date();
    const isCancelled = meeting.status === 'cancelled';
    const isCompleted = meeting.status === 'completed';
    const baseColor = meeting.workplace_color || '#2563eb';
    
    let style: React.CSSProperties = {
        backgroundColor: baseColor,
        color: '#fff',
        border: 'none',
        borderLeft: '3px solid rgba(0,0,0,0.2)',
        opacity: 1,
        borderRadius: '4px',
        fontSize: '0.8rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    };

    if (isCancelled) {
        style = { ...style, backgroundColor: '#ef4444', textDecoration: 'line-through', opacity: 0.7 };
    } else if (isCompleted || isPast) {
        style = { ...style, backgroundColor: '#64748b', opacity: 0.85, filter: 'grayscale(30%)' };
    }

    return { style };
};

export const getSlotStyles = (date: Date, events: CalendarEvent[]) => {
    const isDayOff = events.some(ev => 
        ev.resource.event_type === 'time_off' && 
        isWithinInterval(date, { start: ev.start, end: ev.end })
    );

    if (isDayOff) {
        return {
            className: '!bg-destructive/5 !cursor-not-allowed' 
        };
    }
    return {};
};