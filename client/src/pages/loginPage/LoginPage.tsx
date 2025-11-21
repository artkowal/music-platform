import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { LoginForm } from "@/pages/loginPage/components/LoginForm"; 

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      
      <div className="flex items-center gap-2 mb-6">
        <img src={logo} alt="MusicDesk Logo" className="h-8 w-8" />
        <span className="text-xl font-bold">MusicDesk</span>
      </div>

      <LoginForm />

      <p className="mt-6 px-8 text-center text-xs text-muted-foreground">
        Logując się, zgadzasz się z naszymi{" "}
        <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
          Warunkami
        </Link>{" "}
        i{" "}
        <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
          Polityką prywatności
        </Link>
        .
      </p>
    </div>
  );
}