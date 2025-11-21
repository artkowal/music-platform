import { useState } from "react";
import { workplacesApi } from "@/api/workplaces";
import { useWorkplace } from "@/context/WorkplaceContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", 
  "#8b5cf6", "#d946ef", "#ec4899", "#64748b"
];

interface Props {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateWorkplaceDialog({ children, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const { refreshWorkplaces } = useWorkplace();
  
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[7]); 
  const [paymentType, setPaymentType] = useState<"none" | "per_lesson" | "monthly">("none");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    try {
      await workplacesApi.create({ 
        name, 
        color_hex: selectedColor,
        payment_type: paymentType,
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : null
      });
      
      await refreshWorkplaces();
      
      // Reset
      setName("");
      setPaymentType("none");
      setPaymentAmount("");
      
      if (setIsOpen) setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas tworzenia placówki.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj nową placówkę</DialogTitle>
          <DialogDescription>
            Stwórz nowe miejsce pracy, aby grupować swoich uczniów i kursy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nazwa placówki</Label>
            <Input
              id="name"
              placeholder="np. Szkoła Muzyczna w Radomiu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Kolor identyfikacyjny</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full border flex items-center justify-center transition-all",
                    selectedColor === color 
                      ? "ring-2 ring-offset-2 ring-offset-background ring-black dark:ring-white scale-110" 
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check className="h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
             <div className="grid gap-2">
                <Label>Model rozliczeń (dla statystyk)</Label>
                <Select value={paymentType} onValueChange={(val: "none" | "per_lesson" | "monthly") => setPaymentType(val)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Bez płatności / Wolontariat</SelectItem>
                        <SelectItem value="per_lesson">Stawka za lekcję</SelectItem>
                        <SelectItem value="monthly">Stała pensja miesięczna</SelectItem>
                    </SelectContent>
                </Select>
             </div>

             {paymentType !== 'none' && (
               <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label htmlFor="amount">
                    {paymentType === 'per_lesson' ? 'Kwota za jedną lekcję (PLN)' : 'Miesięczne wynagrodzenie (PLN)'}
                  </Label>
                  <Input 
                    id="amount"
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
               </div>
             )}
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name}>
            {isSubmitting ? "Tworzenie..." : "Utwórz placówkę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}