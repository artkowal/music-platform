import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

interface CourseSettingsHeaderProps {
  title: string;
  subtitle?: string;
}

export function CourseSettingsHeader({ title, subtitle }: CourseSettingsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                <Settings className="h-5 w-5" />
            </div>
            
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>

        <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Wróć
        </Button>

      </div>
    </div>
  );
}