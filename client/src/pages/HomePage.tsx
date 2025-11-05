import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 text-center">
      <h1 className="bg-gradient-brand bg-clip-text text-6xl font-extrabold text-transparent">
        Zarządzaj swoimi lekcjami muzyki
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-text-secondary">
        MusicDesk to nowoczesna platforma, która ułatwia nauczycielom i uczniom
        organizację zajęć, udostępnianie materiałów i śledzenie postępów.
      </p>
      <div className="mt-12 flex gap-4">
        <Button asChild size="lg">
          <Link to="/register">Zacznij teraz</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/login">Mam już konto</Link>
        </Button>
      </div>
    </div>
  );
}