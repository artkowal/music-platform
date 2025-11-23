import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, CheckCircle2, Clock } from "lucide-react";
import { lessonsApi } from "@/api/lessons";
import { cn } from "@/lib/utils";

interface Props {
  lessonId: number;
  initialTime: number;
  isCompletedInitial: boolean;
  accentColor: string;
}

export function LessonTimerMinimal({ lessonId, initialTime, isCompletedInitial, accentColor }: Props) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(isCompletedInitial);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if(intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const saveProgress = async (finished = false) => {
    try {
      await lessonsApi.updateProgress(lessonId, seconds, finished);
      if (finished) setIsCompleted(true);
    } catch (err) {
      console.error("Błąd zapisu czasu", err);
    }
  };

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      saveProgress(isCompleted);
    } else {
      setIsActive(true);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    saveProgress(true);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0'+s : s}`;
  };

  return (
    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border rounded-lg p-1.5 shadow-sm">
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md min-w-[100px] justify-center">
        <Clock className={cn("h-4 w-4", isActive && "animate-pulse text-primary")} />
        <span className="font-mono font-bold text-lg tabular-nums">
            {formatTime(seconds)}
        </span>
      </div>

      <div className="h-8 w-px bg-border mx-1" />

      <Button 
        variant={isActive ? "secondary" : "outline"}
        size="icon" 
        className="h-9 w-9" 
        onClick={toggleTimer}
        title={isActive ? "Pauza" : "Start"}
        style={isActive ? { color: accentColor, borderColor: accentColor } : {}}
      >
        {isActive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </Button>

      {!isCompleted ? (
          <Button 
            className="h-9 gap-2 px-3"
            onClick={handleComplete}
            style={{ backgroundColor: accentColor }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Oznacz jako wykonaną</span>
          </Button>
      ) : (
          <div className="flex items-center gap-2 px-3 text-green-600 bg-green-50 h-9 rounded-md border border-green-200 font-medium text-xs">
              <CheckCircle2 className="h-4 w-4" />
              Ukończono
          </div>
      )}
    </div>
  );
}