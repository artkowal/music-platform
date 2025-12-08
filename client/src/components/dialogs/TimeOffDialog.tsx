import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { meetingsApi } from "@/api/meetings";
import { Loader2, CalendarOff, Trash2, Save } from "lucide-react";
import { format } from "date-fns";

export interface TimeOffData {
    id: number;
    start: Date;
    end: Date;
    title: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TimeOffData | null;
}

export function TimeOffDialog({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [date, setDate] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [note, setNote] = useState("");

  useEffect(() => {
      if (isOpen) {
          if (initialData) {
              const start = initialData.start;
              const end = initialData.end;
              
              setDate(format(start, "yyyy-MM-dd"));
              setNote(initialData.title === "Nauczyciel niedostępny" ? "" : initialData.title);
              
              const isFullDay = 
                  start.getHours() === 0 && start.getMinutes() === 0 &&
                  end.getHours() === 23 && end.getMinutes() === 59;

              setIsAllDay(isFullDay);
              setStartTime(format(start, "HH:mm"));
              setEndTime(format(end, "HH:mm"));
          } else {
              setDate("");
              setIsAllDay(true);
              setStartTime("08:00");
              setEndTime("16:00");
              setNote("");
          }
      }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!date) return;
    setLoading(true);

    try {
        let startIso, endIso;

        if (isAllDay) {
            startIso = new Date(`${date}T00:00:00`).toISOString();
            endIso = new Date(`${date}T23:59:59`).toISOString();
        } else {
            startIso = new Date(`${date}T${startTime}:00`).toISOString();
            endIso = new Date(`${date}T${endTime}:00`).toISOString();
        }

        const payload = {
            start_time: startIso,
            end_time: endIso,
            note: note || "Niedostępny"
        };

        if (initialData) {
            await meetingsApi.updateTimeOff(initialData.id, payload);
        } else {
            await meetingsApi.createTimeOff(payload);
        }

        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        alert("Wystąpił błąd podczas zapisywania.");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!initialData) return;
      if (!confirm("Czy na pewno chcesz usunąć ten dzień wolny?")) return;
      
      setIsDeleting(true);
      try {
          await meetingsApi.deleteTimeOff(initialData.id);
          onSuccess();
          onClose();
      } catch (error) {
          console.error(error);
          alert("Nie udało się usunąć wpisu.");
      } finally {
          setIsDeleting(false);
      }
  };

  const isEditMode = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-orange-600" />
            {isEditMode ? "Edytuj niedostępność" : "Zgłoś niedostępność"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md bg-muted/40">
                <Label htmlFor="allday" className="cursor-pointer">Cały dzień</Label>
                <Switch id="allday" checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>

            {!isAllDay && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="grid gap-2">
                        <Label>Od godziny</Label>
                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Do godziny</Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                </div>
            )}

            <div className="grid gap-2">
                <Label>Powód (opcjonalnie)</Label>
                <Input placeholder="np. Urlop, Sprawy prywatne" value={note} onChange={e => setNote(e.target.value)} />
            </div>
        </div>

        <DialogFooter className="flex-row sm:justify-between items-center gap-2">
            {isEditMode ? (
                <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={isDeleting || loading}
                    className="gap-2"
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    Usuń
                </Button>
            ) : <div/>}

            <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>Anuluj</Button>
                <Button onClick={handleSubmit} disabled={loading || !date} className="bg-orange-600 hover:bg-orange-700 gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEditMode ? "Zapisz zmiany" : "Zapisz"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}