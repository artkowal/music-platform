import { useState, useEffect } from "react";
import { coursesApi } from "@/api/courses";
import { usersApi } from "@/api/users";
import { useWorkplace } from "@/context/WorkplaceContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users, Mail } from "lucide-react";

interface Props {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCourseDialog({ children, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const { activeWorkplace } = useWorkplace();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseType, setCourseType] = useState("individual");

  const [currentEmail, setCurrentEmail] = useState("");
  const [studentEmails, setStudentEmails] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pobieranie podpowiedzi przy wpisywaniu
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (currentEmail.length < 2 || currentEmail.includes("@")) {
        setSuggestions([]);
        return;
      }
      try {
        const emails = await usersApi.search(currentEmail);
        setSuggestions(emails.filter((email: string) => !studentEmails.includes(email)));
      } catch (error) {
        console.error("Błąd pobierania podpowiedzi", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [currentEmail, studentEmails]);

  const handleAddEmail = () => {
    if (currentEmail && currentEmail.includes("@") && !studentEmails.includes(currentEmail)) {
      setStudentEmails([...studentEmails, currentEmail]);
      setCurrentEmail("");
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (email: string) => {
    setCurrentEmail(email);
    setSuggestions([]); 
  };

  const handleRemoveEmail = (email: string) => {
    setStudentEmails(studentEmails.filter(e => e !== email));
  };

  const handleSubmit = async () => {
    if (!title) return;

    if (currentEmail.trim().length > 0) {
      alert("Wpisałeś adres email, ale go nie dodałeś. Kliknij ikonę '+' (plus) obok pola adresu, aby dodać ucznia do listy.");
      return;
    }

    setIsSubmitting(true);
    try {
      await coursesApi.create({ 
        title, 
        description,
        course_type: courseType,
        workplace_id: activeWorkplace?.workplace_id || null,
        student_emails: studentEmails
      });
      
      setTitle("");
      setDescription("");
      setStudentEmails([]);
      setCurrentEmail("");
      setCourseType("individual");
      
      if (onSuccess) onSuccess();
      if (setIsOpen) setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Błąd tworzenia kursu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Utwórz nowy kurs</DialogTitle>
          <DialogDescription>
            {activeWorkplace 
              ? `Kurs zostanie przypisany do: ${activeWorkplace.name}` 
              : "Kurs prywatny (nieprzypisany do placówki)"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="title">Nazwa kursu</Label>
            <Input
              id="title"
              placeholder="np. Pianino - Grupa Zaawansowana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Rodzaj zajęć</Label>
                <Select value={courseType} onValueChange={setCourseType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="individual">Indywidualne</SelectItem>
                        <SelectItem value="group">Grupowe</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid gap-2">
             <Label>Opis (opcjonalnie)</Label>
             <Input 
                placeholder="Krótki opis..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
             />
          </div>

          <div className="border-t pt-4 mt-2 relative">
            <Label className="mb-2 block">Dodaj uczniów (email)</Label>
            <div className="flex gap-2 mb-2 relative">
              <div className="relative w-full">
                <Input 
                  placeholder="Zacznij wpisywać email (np. jan...)" 
                  value={currentEmail}
                  onChange={e => setCurrentEmail(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
                  autoComplete="off"
                />
                
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-md z-50 max-h-40 overflow-y-auto">
                    {suggestions.map((email) => (
                      <div 
                        key={email}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onClick={() => handleSelectSuggestion(email)}
                      >
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button type="button" variant="secondary" onClick={handleAddEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {studentEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted rounded-md max-h-[100px] overflow-y-auto">
                {studentEmails.map(email => (
                  <Badge key={email} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                    <Users className="h-3 w-3 opacity-50" />
                    {email}
                    <button onClick={() => handleRemoveEmail(email)} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Tworzenie..." : "Utwórz kurs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}