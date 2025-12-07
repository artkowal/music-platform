import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coursesApi } from "@/api/courses";

interface Props {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JoinCourseDialog({ children, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!code) return;
    setIsSubmitting(true);
    try {
      await coursesApi.joinByCode(code);
      
      setCode("");
      if (onSuccess) onSuccess();
      if (setIsOpen) setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Dołącz do kursu</DialogTitle>
          <DialogDescription>
            Wprowadź kod zaproszenia otrzymany od nauczyciela.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Kod zaproszenia</Label>
            <Input
              id="code"
              placeholder="xxxxxx"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="uppercase font-mono tracking-widest text-center text-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || code.length < 3}>
            {isSubmitting ? "Dołączanie..." : "Dołącz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}