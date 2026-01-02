import { TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancesHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  years: number[];
}

const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

export function FinancesHeader({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  setSelectedYear,
  years 
}: FinancesHeaderProps) {
  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                <TrendingUp className="h-5 w-5" />
            </div>
            
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Rozliczenia</h1>
                <p className="text-sm text-muted-foreground">
                    Statystyki i finanse dla Twoich placówek.
                </p>
            </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border self-start md:self-auto">
            <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0 h-8 text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="w-px h-4 bg-border" />

            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px] border-none bg-transparent shadow-none focus:ring-0 h-8 text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

      </div>
    </div>
  );
}