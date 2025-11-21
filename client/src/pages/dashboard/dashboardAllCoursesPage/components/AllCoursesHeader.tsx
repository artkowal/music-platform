import { Briefcase } from "lucide-react";

interface AllCoursesHeaderProps {
  count: number;
  isTeacher: boolean;
}

export function AllCoursesHeader({ count, isTeacher }: AllCoursesHeaderProps) {
  return (
    // Ujemne marginesy (-mx, -mt) niwelują padding rodzica
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                <Briefcase className="h-5 w-5" />
            </div>
            
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Wszystkie Kursy</h1>
                <p className="text-sm text-muted-foreground">
                {isTeacher
                    ? "Lista wszystkich kursów ze wszystkich Twoich placówek."
                    : "Lista kursów, w których bierzesz udział."}
                </p>
            </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border px-3 py-1.5 rounded-md">
            <Briefcase className="h-4 w-4 opacity-70" />
            <span className="text-xs uppercase font-semibold tracking-wider">Łącznie:</span>
            <strong className="text-foreground">{count}</strong>
        </div>

      </div>
    </div>
  );
}