"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ROUTES } from "@/utils/constants";
import { forgotPasswordSchema } from "@/utils/validation";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isForgotPasswordLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid email address");
      return;
    }

    setError("");
    requestPasswordReset(parsed.data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100">
      <SiteHeader />
      <main className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-700">Reset Password</h1>
            <p className="text-gray-500 text-sm mt-1">
              We’ll send you a secure link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
              required
              autoComplete="email"
            />

            <Button type="submit" className="w-full" isLoading={isForgotPasswordLoading}>
              <Mail size={18} className="mr-2" />
              Send Reset Link
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remembered your password? {" "}
            <Link href={ROUTES.LOGIN} className="text-brand-600 font-medium hover:text-brand-700">
              Back to Sign In
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter compact />
    </div>
  );
}
