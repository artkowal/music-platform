import type { Meeting } from "@/types/Meeting";

export interface ExtendedMeeting extends Meeting {
  event_type?: 'lesson' | 'time_off';
}

export interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: ExtendedMeeting;
    allDay?: boolean;
}