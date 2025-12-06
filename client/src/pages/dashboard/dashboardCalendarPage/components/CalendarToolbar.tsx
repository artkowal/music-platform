import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface CalendarToolbarProps {
  date: Date;
  view: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onViewChange: (view: string) => void;
}

export function CalendarToolbar({ date, view, onNavigate, onViewChange }: CalendarToolbarProps) {
  const label = format(date, view === 'month' ? 'MMMM yyyy' : 'd MMMM yyyy', { locale: pl });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" size="icon" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>
          Dziś
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold capitalize ml-2 min-w-[150px] text-center sm:text-left">
          {label}
        </h3>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={view} onValueChange={onViewChange}>
          <SelectTrigger className="w-[140px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Miesiąc</SelectItem>
            <SelectItem value="week">Tydzień</SelectItem>
            <SelectItem value="day">Dzień</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}