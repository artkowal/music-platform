import { dateFnsLocalizer, type Messages } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";

const locales = { 'pl': pl };

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

export const messages: Messages = {
  date: 'Data',
  time: 'Godzina',
  event: 'Wydarzenie',
  allDay: 'Cały dzień',
  week: 'Tydzień',
  work_week: 'Tydzień roboczy',
  day: 'Dzień',
  month: 'Miesiąc',
  previous: 'Poprzedni',
  next: 'Następny',
  yesterday: 'Wczoraj',
  tomorrow: 'Jutro',
  today: 'Dziś',
  agenda: 'Agenda',
  noEventsInRange: 'Brak wydarzeń w tym zakresie.',
  showMore: (total) => `+ ${total} więcej`,
};