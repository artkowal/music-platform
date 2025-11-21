import { RegisterForm } from "@/pages/RegisterPage/components/RegisterForm";

export default function RegisterPage() {
  return (

    <div className="flex min-h-svh flex-col items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <RegisterForm />
      </div>
    </div>
  );
}