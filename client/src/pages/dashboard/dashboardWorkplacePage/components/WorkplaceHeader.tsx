import { useState } from "react";
import { School, Briefcase, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workplace } from "@/types/Workplace";
import { hexToRgba } from "@/lib/colors";
import { WorkplaceDetailsDialog } from "../../../../components/dialogs/WorkplaceDetailsDialog";
import type { WorkplaceStats } from "@/api/finances";

interface WorkplaceHeaderProps {
  workplace: Workplace;
  stats: {
    courses: number;
    students: number;
  };
}

export function WorkplaceHeader({ workplace, stats }: WorkplaceHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const now = new Date();

  return (
    <>
      <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
              <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm shrink-0"
                  style={{ 
                      backgroundColor: hexToRgba(workplace.color_hex, 0.1),
                      borderColor: hexToRgba(workplace.color_hex, 0.2),
                      color: workplace.color_hex
                  }}
              >
                  <School className="h-6 w-6" />
              </div>
              
              <div>
                  <h1 className="text-2xl font-bold tracking-tight">{workplace.name}</h1>
                  <p className="text-sm text-muted-foreground">
                      Panel zarządzania szkołą
                  </p>
              </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg border border-border/50 justify-center">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 opacity-70" />
                    <span className="font-medium text-foreground">{stats.courses}</span>
                    <span className="hidden sm:inline">Kursów</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 opacity-70" />
                    <span className="font-medium text-foreground">{stats.students}</span>
                    <span className="hidden sm:inline">Uczniów</span>
                </div>
            </div>

            <Button 
                variant="outline" 
                className="gap-2 h-auto py-2"
                onClick={() => setIsDialogOpen(true)}
            >
                <CalendarDays className="h-4 w-4" />
                Kalendarz
            </Button>
          </div>

        </div>
      </div>

      <WorkplaceDetailsDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        workplace={workplace as unknown as WorkplaceStats}
        month={now.getMonth() + 1}
        year={now.getFullYear()}
      />
    </>
  );
}