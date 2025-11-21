import { Settings2 } from "lucide-react";

export function WorkplacesHeader() {
  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary shrink-0">
            <Settings2 className="h-6 w-6" />
        </div>
        
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Zarządzanie Placówkami</h1>
            <p className="text-sm text-muted-foreground">
                Edytuj, usuwaj i zmieniaj kolejność swoich miejsc pracy.
            </p>
        </div>
      </div>
    </div>
  );
}