import { SignupForm } from "@/components/auth/signup-form";
import { Navbar } from "@/components/landing";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen w-full items-center justify-center px-4 pt-16">
        <SignupForm />
      </div>
    </div>
  );
}
