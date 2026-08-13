import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register - MyProdigy",
  description: "Create an account to build a shared home with your partner.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Create Account</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Join MyProdigy to start focus sessions and care for your pet.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
