import { Settings } from "lucide-react";

export function SettingsHeader() {
  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
            <Settings className="h-5 w-5" />
        </div>
        
        <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Ustawienia</h1>
            <p className="text-sm text-muted-foreground">
                Zarządzaj swoim kontem i preferencjami aplikacji.
            </p>
        </div>
      </div>
    </div>
  );
}